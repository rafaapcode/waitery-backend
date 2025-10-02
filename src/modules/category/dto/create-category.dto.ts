import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: '"name" must be at least 4 characters' })
  name: string;

  @IsString()
  @IsNotEmpty()
  icon: string;
}
