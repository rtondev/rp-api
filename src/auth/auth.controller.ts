import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, PhoneCheckDto, PhoneSessionDto, RegisterDto } from './dto/auth.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { SafeUser } from '../common/types/user.type';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('phone/check')
  checkPhone(@Body() dto: PhoneCheckDto) {
    return this.authService.checkPhone(dto);
  }

  @Post('phone/session')
  phoneSession(@Body() dto: PhoneSessionDto) {
    return this.authService.phoneSession(dto);
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
