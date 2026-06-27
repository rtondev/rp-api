import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class RegistrationContextDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  connectionType?: string;

  @IsOptional()
  @IsString()
  effectiveType?: string;

  @IsOptional()
  @IsNumber()
  downlink?: number;
}

export class ProximityTargetDto {
  @IsString()
  @IsNotEmpty()
  placeId: string;
}

export class PhoneCheckDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class PhoneSessionDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegistrationContextDto)
  registrationContext?: RegistrationContextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProximityTargetDto)
  proximityTarget?: ProximityTargetDto;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
