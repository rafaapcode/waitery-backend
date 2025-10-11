import 'reflect-metadata';

import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValid } from 'ulid';

@ValidatorConstraint({ name: 'isUlid', async: false })
export class CustomULIDValidation implements ValidatorConstraintInterface {
  validate(id: string) {
    const isValidId = isValid(id);

    return isValidId;
  }

  defaultMessage() {
    return 'Id is not valid';
  }
}

class OrdersDto {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;
}

export class CreateOrderDto {
  @Validate(CustomULIDValidation)
  org_id: string;

  @Validate(CustomULIDValidation)
  user_id: string;

  @IsString()
  @IsNotEmpty()
  table: string;

  @IsArray()
  @Type(() => OrdersDto)
  products: OrdersDto[];
}
