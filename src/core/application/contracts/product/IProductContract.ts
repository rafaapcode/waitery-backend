import { Product } from 'src/core/domain/entities/product';

export interface IProductContract {
  create(
    params: IProductContract.CreateParams,
  ): Promise<IProductContract.CreateOutput>;

  update(
    params: IProductContract.UpdateParams,
  ): Promise<IProductContract.UpdateOutput>;

  delete(
    params: IProductContract.DeleteParams,
  ): Promise<IProductContract.DeleteOutput>;

  get(params: IProductContract.GetParams): Promise<IProductContract.GetOutput>;

  getAll(
    params: IProductContract.GetAllParams,
  ): Promise<IProductContract.GetAllOutput>;

  verifyOrgById(
    params: IProductContract.VerifyOrgsParamsById,
  ): Promise<IProductContract.VerifyOrgsOutput>;
}

export namespace IProductContract {
  export type CreateParams = {
    org_id: string;
    name: string;
    image_url: string;
    description: string;
    price: number;
    category_id: string;
    discounted_price?: number;
    discount: boolean;
    city: string;
    ingredients: string[];
  };

  export type CreateOutput = Product;

  export type UpdateParams = {
    id: string;
    data: {
      name: string;
      image_url: string;
      description: string;
      price: number;
      discounted_price?: number;
      discount: boolean;
      city: string;
      ingredients: string[];
    };
  };

  export type UpdateOutput = Product;

  export type DeleteParams = string;

  export type DeleteOutput = void;

  export type GetParams = string;

  export type GetOutput = Product | null;

  export type GetAllParams = {
    org_id: string;
  };

  export type GetAllOutput = Product[] | null;

  export type VerifyOrgsParamsById = {
    user_id: string;
    org_id: string;
  };

  export type VerifyOrgsOutput = boolean;
}
