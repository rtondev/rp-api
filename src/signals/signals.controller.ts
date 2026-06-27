import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { SignalsService } from './signals.service';
import { CreatePlaceSignalDto, RespondSignalDto } from './dto/signal.dto';
import { ListGestorSignalsQueryDto } from './dto/list-signals-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { SafeUser } from '../common/types/user.type';

@Controller()
export class SignalsController {
  constructor(private signalsService: SignalsService) {}

  @Get('signals/resolve/:code')
  @UseGuards(AuthGuard('jwt'))
  resolveSignalCode(@Param('code') code: string) {
    return this.signalsService.resolveSignalCode(code);
  }

  @Post('places/:placeId/signals')
  @UseGuards(AuthGuard('jwt'))
  createPlaceSignal(
    @Param('placeId') placeId: string,
    @CurrentUser() user: SafeUser,
    @Body() dto: CreatePlaceSignalDto,
  ) {
    return this.signalsService.createPlaceSignal(placeId, user.id, dto);
  }

  @Get('places/:placeId/signals')
  listPlaceSignals(@Param('placeId') placeId: string) {
    return this.signalsService.listPlaceSignals(placeId);
  }

  @Patch('places/:placeId/signals/:signalId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.GESTOR, UserRole.ADMIN)
  respondPlaceSignal(
    @Param('placeId') placeId: string,
    @Param('signalId') signalId: string,
    @CurrentUser() user: SafeUser,
    @Body() dto: RespondSignalDto,
  ) {
    return this.signalsService.respondPlaceSignal(
      placeId,
      signalId,
      user.id,
      user.role,
      dto,
    );
  }

  @Get('gestor/signals')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.GESTOR, UserRole.ADMIN)
  listGestorPlaceSignals(
    @CurrentUser() user: SafeUser,
    @Query() query: ListGestorSignalsQueryDto,
  ) {
    return this.signalsService.listGestorPlaceSignals(user, query);
  }

  @Get('me/signals')
  @UseGuards(AuthGuard('jwt'))
  listMySignals(
    @CurrentUser() user: SafeUser,
    @Query() query: ListGestorSignalsQueryDto,
  ) {
    return this.signalsService.listMyPlaceSignals(user.id, query);
  }
}
