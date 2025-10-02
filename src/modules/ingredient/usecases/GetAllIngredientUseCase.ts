import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';

interface IGetAllIngredientUseCase {
  execute(): Promise<Ingredient[]>;
}

@Injectable()
export class GetAllIngredientUseCase implements IGetAllIngredientUseCase {
  constructor(
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingContract: IIngredientContract,
  ) {}
  async execute(): Promise<Ingredient[]> {
    const ings = await this.ingContract.getAll();

    if (ings.length === 0) throw new NotFoundException('Ingredients not Found');

    return ings;
  }
}
