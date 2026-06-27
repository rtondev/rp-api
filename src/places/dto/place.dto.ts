import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LinkDto {
  @IsString()
  label: string;

  @IsUrl()
  url: string;
}

export class CreatePlaceDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  available?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  @IsOptional()
  links?: LinkDto[];

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsObject()
  openingHours?: Record<string, unknown>;
}

export class UpdatePlaceDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  available?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  @IsOptional()
  links?: LinkDto[];

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsOptional()
  @IsObject()
  openingHours?: Record<string, unknown>;
}
