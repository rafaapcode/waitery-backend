import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
  Validate,
} from 'class-validator';
import { CustomULIDValidation } from 'src/modules/order/dto/create-order.dto';

export class CreateProductDto {
  @Validate(CustomULIDValidation)
  org_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['https'] })
  image_url: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @Validate(CustomULIDValidation)
  category_id: string;

  @IsString()
  @IsArray({ each: true })
  @Type(() => String)
  ingredients: string[];
}
