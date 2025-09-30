import { Injectable } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';

@Injectable()
export class IngredientService implements IIngredientContract {
  create: (
    data: IIngredientContract.CreateParams,
  ) => Promise<IIngredientContract.CreateOutput>;
  update: (
    data: IIngredientContract.UpdateParams,
  ) => Promise<IIngredientContract.UpdateOutput>;
  delete: (
    data: IIngredientContract.DeleteParams,
  ) => Promise<IIngredientContract.DeleteOutput>;
  get: (
    data: IIngredientContract.GetIngredientParams,
  ) => Promise<IIngredientContract.GetIngredientOutput>;
  getAll: () => Promise<IIngredientContract.GetAllIngredientsOutput>;
}
