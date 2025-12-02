import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Validate,
} from 'class-validator';
import { CustomULIDValidation } from 'src/modules/order/dto/create-order.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @Validate(CustomULIDValidation)
  category_id: string;

  @IsArray()
  @Type(() => String)
  ingredients: string[];
}
