import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class AddDiscountToProductDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  discounted_price: number;
}
