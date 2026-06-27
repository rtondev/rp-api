import {
  Allow,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import { SignalType } from '@prisma/client';

export class SubmitContextDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsObject()
  deviceMeta?: Record<string, unknown>;
}

export class CreatePlaceSignalDto {
  @IsEnum(SignalType)
  type: SignalType;

  @IsInt()
  @Min(0)
  @Max(5)
  priority: number;

  @Allow()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsString()
  message: string;

  @ValidateNested()
  @Type(() => SubmitContextDto)
  submitContext: SubmitContextDto;
}

export class RespondSignalDto {
  @IsString()
  response: string;
}

export function assertPlaceSignalDto(dto: CreatePlaceSignalDto) {
  if (dto.type === SignalType.ELOGIO && (dto.rating == null || dto.rating < 1)) {
    throw new BadRequestException(
      'Elogios precisam de uma nota de 1 a 5 estrelas',
    );
  }
  if (dto.type === SignalType.SINALIZACAO && dto.rating != null) {
    throw new BadRequestException(
      'Sinalizações não podem incluir nota',
    );
  }
}
