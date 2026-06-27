import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { FavoritesService } from './favorites.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { SafeUser } from '../common/types/user.type';

@Controller('favorites')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.TURISTA)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: SafeUser) {
    return this.favoritesService.list(user.id);
  }

  @Get(':placeId')
  check(@CurrentUser() user: SafeUser, @Param('placeId') placeId: string) {
    return this.favoritesService.isFavorite(user.id, placeId);
  }

  @Post(':placeId')
  add(@CurrentUser() user: SafeUser, @Param('placeId') placeId: string) {
    return this.favoritesService.add(user.id, placeId);
  }

  @Delete(':placeId')
  remove(@CurrentUser() user: SafeUser, @Param('placeId') placeId: string) {
    return this.favoritesService.remove(user.id, placeId);
  }
}
