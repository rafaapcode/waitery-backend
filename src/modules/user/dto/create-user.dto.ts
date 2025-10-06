import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  Validate,
} from 'class-validator';
import { UserRole } from 'src/core/domain/entities/user';
import { CustomULIDValidation } from 'src/modules/order/dto/create-order.dto';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: '"name" must be at least 8 characters' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: '"password" must be at least 8 characters' })
  password: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsString()
  @IsNotEmpty()
  @MinLength(11, { message: '"cpf" must be at least 11 characters' })
  cpf: string;

  @Validate(CustomULIDValidation)
  org_id: string;
}
