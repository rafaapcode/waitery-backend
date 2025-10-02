import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

  async execute(id: string): Promise<Ingredient> {
    const ing = await this.ingContract.get(id);

    if (!ing) throw new NotFoundException('Ingredient not found');

    return new Ingredient(ing);
  }
}
