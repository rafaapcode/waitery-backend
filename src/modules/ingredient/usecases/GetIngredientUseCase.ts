import { Inject, Injectable } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';

interface IGetIngredientUseCase {
  execute(id: string): Promise<Ingredient>;
}

@Injectable()
export class GetIngredientUseCase implements IGetIngredientUseCase {
  constructor(
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingContract: IIngredientContract,
  ) {}

  execute(id: string): Promise<Ingredient> {
    throw new Error('Method not implemented.');
  }
}
