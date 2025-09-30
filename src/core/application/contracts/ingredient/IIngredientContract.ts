// import { Ingredient } from 'src/core/domain/entities/ingredient'; // Use this entitie

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
}

export namespace IIngredientContract {
  export type CreateParams = {
    name: string;
    icon: string;
  };
  export type CreateOutput = { name: string; icon: string };

  export type UpdateParams = {
    id: string;
    ingredient: Partial<{
      name: string;
      icon: string;
    }>;
  };
  export type UpdateOutput = Partial<{
    id: string;
    name: string;
    icon: string;
  }>;

  export type DeleteParams = string;
  export type DeleteOutput = void;

  export type GetIngredientParams = string;
  export type GetIngredientOutput = {
    id: string;
    name: string;
    icon: string;
  };

  export type GetAllIngredientsOutput = {
    id: string;
    name: string;
    icon: string;
  }[];
}
