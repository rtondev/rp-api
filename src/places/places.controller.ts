import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { PlacesService } from './places.service';
import { CreatePlaceDto, UpdatePlaceDto } from './dto/place.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { SafeUser } from '../common/types/user.type';

@Controller('places')
export class PlacesController {
  constructor(private placesService: PlacesService) {}

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    return this.placesService.findAll(categoryId);
  }

  @Get(':id/signal-access')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.GESTOR, UserRole.ADMIN)
  getSignalAccess(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.placesService.getSignalAccess(id, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.placesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.GESTOR, UserRole.ADMIN)
  create(@Body() dto: CreatePlaceDto, @CurrentUser() user: SafeUser) {
    return this.placesService.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.GESTOR, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlaceDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.placesService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.placesService.remove(id);
  }
}
