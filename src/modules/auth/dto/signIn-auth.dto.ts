import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignInAuthDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: '"password" must be at least 8 characters' })
  password: string;
}
