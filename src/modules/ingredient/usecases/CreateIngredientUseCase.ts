import { Inject, Injectable } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { CreateIngredientDto } from '../dto/create-ingredient.dto';

interface ICreateIngredientUseCase {
  execute(data: CreateIngredientDto): Promise<Ingredient>;
}

@Injectable()
export class CreateIngredientUseCase implements ICreateIngredientUseCase {
  constructor(
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingContract: IIngredientContract,
  ) {}

  execute(data: CreateIngredientDto): Promise<Ingredient> {
    throw new Error('Method not implemented.');
  }
}
