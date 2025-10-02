import { Category } from 'src/core/domain/entities/category';

export interface ICategoryContract {
  create: (
    data: ICategoryContract.CreateParams,
  ) => Promise<ICategoryContract.CreateOutput>;
  update: (
    data: ICategoryContract.UpdateParams,
  ) => Promise<ICategoryContract.UpdateOutput>;
  delete: (
    data: ICategoryContract.DeleteParams,
  ) => Promise<ICategoryContract.DeleteOutput>;

  getCategory: (
    data: ICategoryContract.GetCategoryParams,
  ) => Promise<ICategoryContract.GetCategoryOutput>;

  getAllCategories: (
    data: ICategoryContract.GetAllCategoriesOfOrgParams,
  ) => Promise<ICategoryContract.GetAllCategoriesOfOrgOutput>;

  getCategoryByName: (
    data: ICategoryContract.GetCategoriesByNameParams,
  ) => Promise<ICategoryContract.GetCategoriesByNameOutput>;
}

export namespace ICategoryContract {
  export type CreateParams = Category;
  export type CreateOutput = Category;

  export type UpdateParams = {
    id: string;
    category: {
      name?: string;
      icon?: string;
    };
  };
  export type UpdateOutput = Category;

  export type DeleteParams = string;
  export type DeleteOutput = void;

  export type GetCategoryParams = string;
  export type GetCategoryOutput = Category | null;

  export type GetAllCategoriesOfOrgParams = string;
  export type GetAllCategoriesOfOrgOutput = Category[];

  export type GetCategoriesByNameParams = string;
  export type GetCategoriesByNameOutput = Category | null;
}
