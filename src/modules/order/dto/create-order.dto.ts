import {
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValid } from 'ulid';

@ValidatorConstraint({ name: 'isUlid', async: false })
export class CustomULIDValidattion implements ValidatorConstraintInterface {
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
  @Validate(CustomULIDValidattion)
  org_id: string;

  @Validate(CustomULIDValidattion)
  user_id: string;

  // total_price: number;
  // quantity: number;
  // table: string;
  // products: Product[];
}
