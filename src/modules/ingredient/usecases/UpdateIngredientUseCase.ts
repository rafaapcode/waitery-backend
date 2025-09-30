import { Inject, Injectable } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto';

interface IUpdateIngredientUseCase {
  execute({
    id,
    data,
  }: {
    id: string;
    data: UpdateIngredientDto;
  }): Promise<Ingredient>;
}

@Injectable()
export class UpdateIngredientUseCase implements IUpdateIngredientUseCase {
  constructor(
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingContract: IIngredientContract,
  ) {}

  execute({
    id,
    data,
  }: {
    id: string;
    data: UpdateIngredientDto;
  }): Promise<Ingredient> {
    throw new Error('Method not implemented.');
  }
}
