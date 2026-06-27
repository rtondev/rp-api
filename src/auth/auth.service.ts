import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginDto,
  PhoneCheckDto,
  PhoneSessionDto,
  RegisterDto,
} from './dto/auth.dto';
import type { SafeUser } from '../common/types/user.type';
import { normalizePhone } from '../common/utils/phone.util';
import { assertWithinMeters } from '../common/utils/geo.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private sanitize(user: User): SafeUser {
    const { password: _, ...safe } = user;
    return safe;
  }

  async checkPhone(dto: PhoneCheckDto) {
    const phone = normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true },
    });

    return {
      exists: Boolean(user),
      name: user?.name,
    };
  }

  async phoneSession(dto: PhoneSessionDto) {
    const phone = normalizePhone(dto.phone);
    const existing = await this.prisma.user.findUnique({ where: { phone } });

    if (existing) {
      return {
        user: this.sanitize(existing),
        token: this.signToken(existing),
        isNew: false,
      };
    }

    if (!dto.name?.trim()) {
      throw new BadRequestException({
        message: 'Informe seu nome para concluir o cadastro',
        code: 'NEEDS_NAME',
      });
    }

    if (!dto.registrationContext) {
      throw new BadRequestException(
        'Permita o acesso à localização para concluir o cadastro',
      );
    }

    if (dto.proximityTarget) {
      await this.assertProximityTarget(
        dto.proximityTarget.placeId,
        dto.registrationContext.latitude,
        dto.registrationContext.longitude,
      );
    }

    const user = await this.prisma.user.create({
      data: {
        phone,
        name: dto.name.trim(),
        role: UserRole.TURISTA,
        registrationLatitude: dto.registrationContext.latitude,
        registrationLongitude: dto.registrationContext.longitude,
        registrationMeta:
          dto.registrationContext as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      user: this.sanitize(user),
      token: this.signToken(user),
      isNew: true,
    };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new UnauthorizedException('E-mail já cadastrado');
    }

    const role = dto.role ?? UserRole.TURISTA;
    if (role !== UserRole.TURISTA && role !== UserRole.GESTOR) {
      throw new UnauthorizedException('Perfil inválido');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password,
        role,
      },
    });

    return {
      user: this.sanitize(user),
      token: this.signToken(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      user: this.sanitize(user),
      token: this.signToken(user),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  async assertProximityTarget(
    id: string,
    latitude: number,
    longitude: number,
  ) {
    const place = await this.prisma.place.findUnique({
      where: { id },
      select: { latitude: true, longitude: true },
    });
    if (!place) throw new BadRequestException('Local não encontrado');
    assertWithinMeters(latitude, longitude, place.latitude, place.longitude);
  }

  private signToken(user: User) {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  }
}
