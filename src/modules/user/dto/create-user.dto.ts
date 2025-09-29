import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/core/domain/entities/user';

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

  @IsString()
  @IsNotEmpty()
  org_id: string;
}
