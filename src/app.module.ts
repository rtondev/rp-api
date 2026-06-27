import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { PlacesModule } from './places/places.module';
import { SignalsModule } from './signals/signals.module';
import { UploadsModule } from './uploads/uploads.module';
import { FavoritesModule } from './favorites/favorites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    PlacesModule,
    SignalsModule,
    UploadsModule,
    FavoritesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
