import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCurrentUserDTO {
  @IsString()
  @IsOptional()
  @MinLength(8, { message: '"name" must be at least 8 characters' })
  name: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(8, { message: '"password" must be at least 8 characters' })
  password?: string;

  @IsString()
  @IsOptional()
  @MinLength(8, { message: '"password" must be at least 8 characters' })
  new_password?: string;
}
