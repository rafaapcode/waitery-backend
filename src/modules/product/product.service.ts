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
        ...(data.ingredients && { image_url: data.image_url }),
        ...(data.name && { name: data.name }),
        ...(data.price && { price: data.price }),
      },
    });
  }

  async delete(
    product_id: IProductContract.DeleteParams,
  ): Promise<IProductContract.DeleteOutput> {
    await this.productRepo.delete(product_id);
  }

  get(
    product_id: IProductContract.GetParams,
  ): Promise<IProductContract.GetOutput> {
    throw new Error('Method not implemented.');
  }

  getAll(
    params: IProductContract.GetAllParams,
  ): Promise<IProductContract.GetAllOutput> {
    throw new Error('Method not implemented.');
  }

  verifyOrgById(
    params: IProductContract.VerifyOrgsParamsById,
  ): Promise<IProductContract.VerifyOrgsOutput> {
    throw new Error('Method not implemented.');
  }
}
