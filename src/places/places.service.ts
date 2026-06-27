import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SignalType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaceDto, UpdatePlaceDto } from './dto/place.dto';
import type { SafeUser } from '../common/types/user.type';
import {
  ensurePlaceSignalCode,
  generateUniqueSignalCode,
} from '../common/utils/signal-code.util';

@Injectable()
export class PlacesService {
  constructor(private prisma: PrismaService) {}

  async findAll(categoryId?: string) {
    const places = await this.prisma.place.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        createdBy: { select: { id: true, name: true, role: true } },
        _count: { select: { signals: true } },
      },
    });

    return this.attachRatingStats(places);
  }

  async findOne(id: string) {
    const place = await this.prisma.place.findUnique({
      where: { id },
      include: {
        category: true,
        createdBy: { select: { id: true, name: true, role: true } },
        signals: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!place) throw new NotFoundException('Local não encontrado');

    const [enriched] = await this.attachRatingStats([place]);
    return enriched;
  }

  async create(dto: CreatePlaceDto, userId: string) {
    await this.ensureCategoryExists(dto.categoryId);
    const { openingHours, links, ...rest } = dto;
    const signalCode = await generateUniqueSignalCode(this.prisma);
    return this.prisma.place.create({
      data: {
        ...rest,
        signalCode,
        links: (links ?? []) as unknown as Prisma.InputJsonValue,
        openingHours: (openingHours ?? {}) as unknown as Prisma.InputJsonValue,
        createdById: userId,
      },
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdatePlaceDto, user: SafeUser) {
    const place = await this.ensureExists(id);
    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }
    if (user.role === UserRole.GESTOR && place.createdById !== user.id) {
      throw new ForbiddenException('Você só pode editar seus próprios locais');
    }
    const { links, openingHours, ...rest } = dto;
    return this.prisma.place.update({
      where: { id },
      data: {
        ...rest,
        ...(links !== undefined
          ? { links: links as unknown as Prisma.InputJsonValue }
          : {}),
        ...(openingHours !== undefined
          ? { openingHours: openingHours as unknown as Prisma.InputJsonValue }
          : {}),
      },
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.place.delete({ where: { id } });
  }

  async getSignalAccess(id: string, user: SafeUser) {
    const place = await this.prisma.place.findUnique({
      where: { id },
      select: { id: true, title: true, signalCode: true, createdById: true },
    });
    if (!place) throw new NotFoundException('Local não encontrado');
    if (user.role !== UserRole.ADMIN && place.createdById !== user.id) {
      throw new ForbiddenException('Sem permissão para ver o código deste local');
    }
    const signalCode = place.signalCode ?? (await ensurePlaceSignalCode(this.prisma, id));
    return {
      kind: 'place' as const,
      id: place.id,
      title: place.title,
      signalCode,
    };
  }

  private async attachRatingStats<T extends { id: string }>(
    places: T[],
  ): Promise<
    (T & { averageRating: number | null; ratingCount: number })[]
  > {
    if (places.length === 0) return [];

    const placeIds = places.map((place) => place.id);
    const groups = await this.prisma.placeSignal.groupBy({
      by: ['placeId'],
      where: {
        placeId: { in: placeIds },
        type: SignalType.ELOGIO,
        rating: { not: null },
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const stats = new Map(
      groups.map((group) => [
        group.placeId,
        {
          averageRating: group._avg.rating,
          ratingCount: group._count.rating,
        },
      ]),
    );

    return places.map((place) => {
      const rating = stats.get(place.id);
      return {
        ...place,
        averageRating: rating?.averageRating ?? null,
        ratingCount: rating?.ratingCount ?? 0,
      };
    });
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Categoria não encontrada');
    }
  }

  private async ensureExists(id: string) {
    const place = await this.prisma.place.findUnique({ where: { id } });
    if (!place) throw new NotFoundException('Local não encontrado');
    return place;
  }
}
