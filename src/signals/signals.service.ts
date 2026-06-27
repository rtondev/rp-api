import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginatedMeta,
  PaginatedResponse,
} from '../common/dto/paginated-response.dto';
import type { SafeUser } from '../common/types/user.type';
import { assertWithinMeters } from '../common/utils/geo.util';
import {
  CreatePlaceSignalDto,
  RespondSignalDto,
  assertPlaceSignalDto,
} from './dto/signal.dto';
import {
  ListGestorSignalsQueryDto,
  SignalSortFilter,
  SignalStatusFilter,
} from './dto/list-signals-query.dto';

const signalUserSelect = { id: true, name: true };
const responderSelect = { id: true, name: true };

@Injectable()
export class SignalsService {
  constructor(private prisma: PrismaService) {}

  async createPlaceSignal(
    placeId: string,
    userId: string,
    dto: CreatePlaceSignalDto,
  ) {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true, latitude: true, longitude: true },
    });
    if (!place) throw new NotFoundException('Local não encontrado');

    assertWithinMeters(
      dto.submitContext.latitude,
      dto.submitContext.longitude,
      place.latitude,
      place.longitude,
    );

    assertPlaceSignalDto(dto);
    return this.prisma.placeSignal.create({
      data: {
        placeId,
        userId,
        type: dto.type,
        priority: dto.priority,
        message: dto.message,
        rating: dto.type === 'ELOGIO' ? dto.rating : null,
        submitLatitude: dto.submitContext.latitude,
        submitLongitude: dto.submitContext.longitude,
        submitMeta: {
          accuracy: dto.submitContext.accuracy,
          deviceMeta: dto.submitContext.deviceMeta,
        } as Prisma.InputJsonValue,
      },
      include: {
        user: { select: signalUserSelect },
        place: { select: { id: true, title: true } },
      },
    });
  }

  async listPlaceSignals(placeId: string) {
    await this.ensurePlaceExists(placeId);
    return this.prisma.placeSignal.findMany({
      where: { placeId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: signalUserSelect },
        respondedBy: { select: responderSelect },
      },
    });
  }

  async listGestorPlaceSignals(
    user: SafeUser,
    query: ListGestorSignalsQueryDto,
  ): Promise<PaginatedResponse<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const scopeWhere = this.gestorScopeWhere(user);
    const listWhere = this.buildSignalsWhere(scopeWhere, query);

    const orderBy =
      query.sort === SignalSortFilter.OLDEST
        ? { createdAt: 'asc' as const }
        : { createdAt: 'desc' as const };

    const include = {
      user: { select: signalUserSelect },
      respondedBy: { select: responderSelect },
      place: { select: { id: true, title: true } },
    };

    const [data, total, pendingTotal, answeredTotal] = await Promise.all([
      this.prisma.placeSignal.findMany({
        where: listWhere,
        orderBy,
        skip,
        take: limit,
        include,
      }),
      this.prisma.placeSignal.count({ where: listWhere }),
      this.prisma.placeSignal.count({
        where: { ...scopeWhere, response: null },
      }),
      this.prisma.placeSignal.count({
        where: { ...scopeWhere, response: { not: null } },
      }),
    ]);

    return {
      data,
      meta: buildPaginatedMeta(
        page,
        limit,
        total,
        pendingTotal,
        answeredTotal,
      ),
    };
  }

  private gestorScopeWhere(user: SafeUser): Prisma.PlaceSignalWhereInput {
    if (user.role === UserRole.ADMIN) return {};
    return { place: { createdById: user.id } };
  }

  private buildSignalsWhere(
    scopeWhere: Prisma.PlaceSignalWhereInput,
    query: ListGestorSignalsQueryDto,
    searchUser = true,
  ): Prisma.PlaceSignalWhereInput {
    const where: Prisma.PlaceSignalWhereInput = { ...scopeWhere };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status === SignalStatusFilter.PENDING) {
      where.response = null;
    } else if (query.status === SignalStatusFilter.ANSWERED) {
      where.response = { not: null };
    }

    const search = query.search?.trim();
    if (search) {
      const searchFilters: Prisma.PlaceSignalWhereInput[] = [
        { message: { contains: search, mode: 'insensitive' } },
        { place: { title: { contains: search, mode: 'insensitive' } } },
      ];
      if (searchUser) {
        searchFilters.push({
          user: { name: { contains: search, mode: 'insensitive' } },
        });
      }
      where.OR = searchFilters;
    }

    return where;
  }

  async listMyPlaceSignals(
    userId: string,
    query: ListGestorSignalsQueryDto,
  ): Promise<PaginatedResponse<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const scopeWhere: Prisma.PlaceSignalWhereInput = { userId };
    const listWhere = this.buildSignalsWhere(scopeWhere, query, false);

    const orderBy =
      query.sort === SignalSortFilter.OLDEST
        ? { createdAt: 'asc' as const }
        : { createdAt: 'desc' as const };

    const include = {
      user: { select: signalUserSelect },
      respondedBy: { select: responderSelect },
      place: { select: { id: true, title: true } },
    };

    const queryPending: ListGestorSignalsQueryDto = {
      ...query,
      status: SignalStatusFilter.PENDING,
    };
    const queryAnswered: ListGestorSignalsQueryDto = {
      ...query,
      status: SignalStatusFilter.ANSWERED,
    };

    const pendingWhere = this.buildSignalsWhere(scopeWhere, queryPending, false);
    const answeredWhere = this.buildSignalsWhere(
      scopeWhere,
      queryAnswered,
      false,
    );

    const [data, total, pendingTotal, answeredTotal] = await Promise.all([
      this.prisma.placeSignal.findMany({
        where: listWhere,
        orderBy,
        skip,
        take: limit,
        include,
      }),
      this.prisma.placeSignal.count({ where: listWhere }),
      this.prisma.placeSignal.count({ where: pendingWhere }),
      this.prisma.placeSignal.count({ where: answeredWhere }),
    ]);

    return {
      data,
      meta: buildPaginatedMeta(
        page,
        limit,
        total,
        pendingTotal,
        answeredTotal,
      ),
    };
  }

  /** @deprecated use listGestorPlaceSignals */
  async listAllPlaceSignals() {
    return this.prisma.placeSignal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: signalUserSelect },
        respondedBy: { select: responderSelect },
        place: { select: { id: true, title: true } },
      },
    });
  }

  async respondPlaceSignal(
    placeId: string,
    signalId: string,
    userId: string,
    role: UserRole,
    dto: RespondSignalDto,
  ) {
    if (role !== UserRole.GESTOR && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Sem permissão para responder');
    }

    const signal = await this.prisma.placeSignal.findFirst({
      where: { id: signalId, placeId },
    });
    if (!signal) throw new NotFoundException('Sinalização não encontrada');

    return this.prisma.placeSignal.update({
      where: { id: signalId },
      data: {
        response: dto.response,
        respondedAt: new Date(),
        respondedById: userId,
      },
      include: {
        user: { select: signalUserSelect },
        respondedBy: { select: responderSelect },
        place: { select: { id: true, title: true } },
      },
    });
  }

  async resolveSignalCode(rawCode: string) {
    const code = rawCode.replace(/\D/g, '');
    if (code.length !== 6) {
      throw new BadRequestException('Informe um código de 6 dígitos');
    }

    const place = await this.prisma.place.findUnique({
      where: { signalCode: code },
      select: {
        id: true,
        title: true,
        available: true,
        latitude: true,
        longitude: true,
      },
    });
    if (place) {
      return {
        kind: 'place' as const,
        id: place.id,
        title: place.title,
        available: place.available,
        latitude: place.latitude,
        longitude: place.longitude,
      };
    }

    throw new NotFoundException('Código não encontrado');
  }

  private async ensurePlaceExists(id: string) {
    const place = await this.prisma.place.findUnique({ where: { id } });
    if (!place) throw new NotFoundException('Local não encontrado');
  }
}
