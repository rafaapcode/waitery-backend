import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsUrl({ protocols: ['https'] })
  image_url?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price?: number;

  @IsBoolean()
  @IsOptional()
  discount?: boolean;

  @IsNumber()
  @IsPositive()
  discounted_price?: number;

  @IsString()
  @IsOptional()
  @IsArray({ each: true })
  @Type(() => String)
  ingredients?: string[];
}
