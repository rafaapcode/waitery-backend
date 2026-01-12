import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateOrganizationDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: '"name" must be at least 4 characters' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: '"name" must be at least 6 characters' })
  description: string;

  @IsString()
  @IsNotEmpty()
  location_code: string;

  @IsNumber()
  @IsNotEmpty()
  open_hour: number;

  @IsNumber()
  @IsNotEmpty()
  close_hour: number;

  @IsString()
  @IsNotEmpty()
  cep: string;
}
