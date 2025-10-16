import 'reflect-metadata';

import { IsEnum } from 'class-validator';
import { OrderStatus } from 'src/core/domain/entities/order';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
