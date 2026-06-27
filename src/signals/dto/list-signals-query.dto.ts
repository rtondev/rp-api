import { SignalType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum SignalStatusFilter {
  ALL = 'all',
  PENDING = 'pending',
  ANSWERED = 'answered',
}

export enum SignalSortFilter {
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export class ListGestorSignalsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SignalType)
  type?: SignalType;

  @IsOptional()
  @IsEnum(SignalStatusFilter)
  status?: SignalStatusFilter = SignalStatusFilter.ALL;

  @IsOptional()
  @IsEnum(SignalSortFilter)
  sort?: SignalSortFilter = SignalSortFilter.NEWEST;
}
