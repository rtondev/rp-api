import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { SafeUser } from '../common/types/user.type';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private sanitize(user: User): SafeUser {
    const { password: _, ...safe } = user;
    return safe;
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.sanitize(user);
  }

  async listAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return users.map((user) => this.sanitize(user));
  }

  async adminUpdateUser(
    userId: string,
    adminId: string,
    dto: AdminUpdateUserDto,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (userId === adminId && dto.role && dto.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Você não pode remover seu próprio perfil de admin');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
      },
    });
    return this.sanitize(updated);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser> {
    const data: { name?: string; password?: string; role?: UpdateProfileDto['role'] } = {};
    if (dto.name) data.name = dto.name;
    if (dto.role) {
      if (dto.role === UserRole.ADMIN) {
        throw new NotFoundException('Perfil inválido');
      }
      data.role = dto.role;
    }
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitize(user);
  }
}
