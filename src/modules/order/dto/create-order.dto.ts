import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  Validate,
  ValidateNested,
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

// class ProductDto {}

export class CreateOrderDto {
  @Validate(CustomULIDValidation)
  org_id: string;

  @Validate(CustomULIDValidation)
  user_id: string;

  @IsString()
  @IsNotEmpty()
  table: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => String)
  products: string[];
}
