import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, PhoneCheckDto, PhoneSessionDto, RegisterDto } from './dto/auth.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getClientIp } from '../common/utils/client-ip.util';
import type { SafeUser } from '../common/types/user.type';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('phone/check')
  checkPhone(@Body() dto: PhoneCheckDto) {
    return this.authService.checkPhone(dto);
  }

  @Post('phone/session')
  phoneSession(@Body() dto: PhoneSessionDto, @Req() req: Request) {
    return this.authService.phoneSession(dto, getClientIp(req));
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@CurrentUser() user: SafeUser) {
    return this.authService.me(user.id);
  }
}
