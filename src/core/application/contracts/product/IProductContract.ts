import { Product } from 'src/core/domain/entities/product';
import { UserRole } from 'src/core/domain/entities/user';

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

  get(
    product_id: IProductContract.GetParams,
  ): Promise<IProductContract.GetOutput>;

  getAll(
    params: IProductContract.GetAllParams,
  ): Promise<IProductContract.GetAllOutput>;

  getProductsByCategory(
    params: IProductContract.GetProductsByCategoryParams,
  ): Promise<IProductContract.GetProductsByCategoryOutput>;

  getProductByName(
    params: IProductContract.GetProductsByNameParams,
  ): Promise<IProductContract.GetProductsByNameOutput>;

  verifyOrgById(
    params: IProductContract.VerifyOrgsParamsById,
  ): Promise<IProductContract.VerifyOrgsOutput>;
}

export namespace IProductContract {
  export type CreateParams = Product;

  export type CreateOutput = Product;

  export type UpdateParams = {
    id: string;
    data: {
      name?: string;
      image_url?: string;
      description?: string;
      price?: number;
      discounted_price?: number;
      discount?: boolean;
      ingredients?: string[];
    };
  };

  export type UpdateOutput = void;

  export type DeleteParams = {
    product_id: string;
    org_id: string;
  };

  export type DeleteOutput = void;

  export type GetParams = {
    product_id: string;
    org_id: string;
  };

  export type GetOutput = Product | null;

  export type GetAllParams = {
    page?: number;
    org_id: string;
  };

  export type GetAllOutput = {
    has_next: boolean;
    products: Product[];
  };

  export type VerifyOrgsParamsById = {
    user_id: string;
    org_id: string;
    user_role: UserRole;
  };

  export type VerifyOrgsOutput = boolean;

  export type GetProductsByCategoryParams = {
    page?: number;
    category_id: string;
    org_id: string;
  };

  export type GetProductsByCategoryOutput = {
    has_next: boolean;
    products: Product[];
  };

  export type GetProductsByNameParams = {
    name: string;
    org_id: string;
  };

  export type GetProductsByNameOutput = Product | null;
}
