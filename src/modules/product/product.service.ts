import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { createCategoryEntity } from 'src/core/domain/entities/category';
import { createProductEntity, Product } from 'src/core/domain/entities/product';
import { ProductRepository } from './repo/product.repository';

@Injectable()
export class ProductService implements IProductContract {
  constructor(private readonly productRepo: ProductRepository) {}
  async create(
    params: IProductContract.CreateParams,
  ): Promise<IProductContract.CreateOutput> {
    const product = await this.productRepo.create(params);

    return createProductEntity({
      ...product,
      ingredients: Product.toCategoryIngredients(
        product.ingredients as Prisma.JsonArray,
      ),
      category: createCategoryEntity({
        ...product.category,
      }),
    });
  }

  async update({
    id,
    data,
  }: IProductContract.UpdateParams): Promise<IProductContract.UpdateOutput> {
    await this.productRepo.update({
      id,
      data: {
        ...(data.description && { description: data.description }),
        ...(data.discount && { discount: data.discount }),
        ...(data.discounted_price && {
          discounted_price: data.discounted_price,
        }),
        ...(data.image_url && { image_url: data.image_url }),
        ...(data.ingredients && { ingredients: data.ingredients }),
        ...(data.name && { name: data.name }),
        ...(data.price && { price: data.price }),
      },
    });
  }

  async delete(
    params: IProductContract.DeleteParams,
  ): Promise<IProductContract.DeleteOutput> {
    await this.productRepo.delete(params);
  }

  async get(
    params: IProductContract.GetParams,
  ): Promise<IProductContract.GetOutput> {
    const product = await this.productRepo.get(params);

    if (!product) return null;

    return createProductEntity({
      ...product,
      ingredients: Product.toCategoryIngredients(
        product.ingredients as Prisma.JsonArray,
      ),
      category: createCategoryEntity({
        ...product.category,
      }),
    });
  }

  async getAll({
    page,
    org_id,
  }: IProductContract.GetAllParams): Promise<IProductContract.GetAllOutput> {
    const LIMIT = 15;
    const PAGE = page ? (page >= 0 ? page : 0) : 0;
    const OFFSET = PAGE * LIMIT;

    const products = await this.productRepo.getAll(org_id, LIMIT + 1, OFFSET);
    let has_next = false;

    if (products.length > LIMIT) {
      has_next = true;
    }

    return {
      has_next,
      products: products.slice(0, LIMIT).map((p) =>
        createProductEntity({
          ...p,
          ingredients: Product.toCategoryIngredients(
            p.ingredients as Prisma.JsonArray,
          ),
          category: createCategoryEntity({
            ...p.category,
          }),
        }),
      ),
    };
  }

  async verifyOrgById(
    params: IProductContract.VerifyOrgsParamsById,
  ): Promise<IProductContract.VerifyOrgsOutput> {
    const userHasOrg = await this.productRepo.verifyOrgById(
      params.org_id,
      params.user_id,
      params.user_role,
    );

    return userHasOrg;
  }

  async getProductsByCategory({
    category_id,
    org_id,
    page,
  }: IProductContract.GetProductsByCategoryParams): Promise<IProductContract.GetProductsByCategoryOutput> {
    const LIMIT = 15;
    const PAGE = page ? (page >= 0 ? page : 0) : 0;
    const OFFSET = PAGE * LIMIT;
    let has_next = false;

    const products = await this.productRepo.getByCategory(
      org_id,
      category_id,
      LIMIT + 1,
      OFFSET,
    );

    if (products.length > LIMIT) {
      has_next = true;
    }

    return {
      has_next,
      products: products.slice(0, LIMIT).map((p) =>
        createProductEntity({
          ...p,
          ingredients: Product.toCategoryIngredients(
            p.ingredients as Prisma.JsonArray,
          ),
          category: createCategoryEntity({
            ...p.category,
          }),
        }),
      ),
    };
  }

  async getProductByName(
    params: IProductContract.GetProductsByNameParams,
  ): Promise<IProductContract.GetProductsByNameOutput> {
    const product = await this.productRepo.getByName(
      params.name,
      params.org_id,
    );

    if (!product) return null;

    return createProductEntity({
      ...product,
      ingredients: Product.toCategoryIngredients(
        product.ingredients as Prisma.JsonArray,
      ),
      category: createCategoryEntity({
        ...product.category,
      }),
    });
  }

  async verifyProdIsRelatedWithOrg(
    params: IProductContract.VerifyProductIsRelatedWithOrgParams,
  ): Promise<IProductContract.VerifyProductIsRelatedWithOrgOutput> {
    const isRelated = await this.productRepo.verifyProdIsRelatedWithOrg(params);

    return isRelated !== null;
  }
}
