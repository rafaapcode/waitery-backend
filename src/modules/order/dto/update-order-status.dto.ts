import 'reflect-metadata';

import { IsEnum, Validate } from 'class-validator';
import { OrderStatus } from 'src/core/domain/entities/order';
import { CustomULIDValidation } from './create-order.dto';

export class UpdateOrderStatusDto {
  @Validate(CustomULIDValidation)
  order_id: string;

  @IsEnum(OrderStatus)
  status: OrderStatus;
}
