import { Ingredient } from 'src/core/domain/entities/ingredient';

export interface IIngredientContract {
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
  getByName: (
    name: IIngredientContract.GetIngredientsByNameParams,
  ) => Promise<IIngredientContract.GetIngredientsByNameOutput>;
}

export namespace IIngredientContract {
  export type CreateParams = Ingredient;
  export type CreateOutput = Ingredient;

  export type UpdateParams = {
    id: string;
    ingredient: {
      name?: string;
      icon?: string;
    };
  };
  export type UpdateOutput = Ingredient;

  export type DeleteParams = string;
  export type DeleteOutput = void;

  export type GetIngredientParams = string;
  export type GetIngredientOutput = Ingredient | null;

  export type GetAllIngredientsOutput = Ingredient[];

  export type GetIngredientsByNameParams = string;
  export type GetIngredientsByNameOutput = Ingredient | null;
}
