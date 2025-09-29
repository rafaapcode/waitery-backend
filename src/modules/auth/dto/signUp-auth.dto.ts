import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignUpAuthDTO {
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

  @IsString()
  @IsNotEmpty()
  @MinLength(11, { message: '"cpf" must be at least 11 characters' })
  cpf: string;
}
