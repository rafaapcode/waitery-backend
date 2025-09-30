import { Inject, Injectable } from '@nestjs/common';
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

  execute(): Promise<Ingredient[]> {
    throw new Error('Method not implemented.');
  }
}
