import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from 'src/core/domain/entities/order';

export class FiltersOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  table?: string;
}
