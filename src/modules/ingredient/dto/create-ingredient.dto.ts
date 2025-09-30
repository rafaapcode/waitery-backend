import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: '"name" must be at least 2 characters' })
  name: string;

  @IsString()
  @IsNotEmpty()
  icon: string;
}
