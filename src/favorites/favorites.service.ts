import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        place: {
          include: { category: true },
        },
      },
    });
  }

  async add(userId: string, placeId: string) {
    const place = await this.prisma.place.findUnique({ where: { id: placeId } });
    if (!place) throw new NotFoundException('Local não encontrado');

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });
    if (existing) throw new ConflictException('Local já está nos favoritos');

    return this.prisma.favorite.create({
      data: { userId, placeId },
      include: {
        place: { include: { category: true } },
      },
    });
  }

  async remove(userId: string, placeId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });
    if (!favorite) throw new NotFoundException('Favorito não encontrado');
    await this.prisma.favorite.delete({ where: { id: favorite.id } });
  }

  async isFavorite(userId: string, placeId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });
    return { favorited: !!favorite };
  }
}
