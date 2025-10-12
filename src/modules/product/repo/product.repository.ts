import { Injectable } from '@nestjs/common';
import { Prisma, Product } from 'generated/prisma';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { PrismaService } from 'src/infra/database/database.service';

type ProductWithCategory = Product & {
  category: {
    name: string;
    id: string;
    org_id: string;
    icon: string;
  };
};

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: IProductContract.CreateParams,
  ): Promise<ProductWithCategory> {
    const product = await this.prisma.product.create({
      data: {
        description: data.description,
        image_url: data.image_url,
        ingredients: data.ingredientsCategoryToPrismaJson(),
        name: data.name,
        price: data.price,
        category_id: data.category.id!,
        org_id: data.org_id,
      },
      include: {
        category: true,
      },
    });

    return product;
  }

  async update(data: IProductContract.UpdateParams): Promise<void> {
    await this.prisma.product.update({
      where: { id: data.id },
      data: {
        ...data.data,
        ...(data.data.ingredients && {
          ingredients: data.data.ingredients as Prisma.JsonArray,
        }),
      },
    });
  }

  async delete(product_id: IProductContract.DeleteParams): Promise<void> {
    await this.prisma.product.delete({
      where: { id: product_id },
    });
  }

  async get(
    product_id: IProductContract.GetParams,
  ): Promise<ProductWithCategory | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: product_id },
      include: {
        category: true,
      },
    });

    return product;
  }

  async getAll(
    params: IProductContract.GetAllParams,
  ): Promise<ProductWithCategory[]> {
    const product = await this.prisma.product.findMany({
      where: { org_id: params.org_id },
      include: {
        category: true,
      },
    });

    return product;
  }

  async verifyOrgById(
    params: IProductContract.VerifyOrgsParamsById,
  ): Promise<boolean> {
    const product = await this.prisma.userOrg.findFirst({
      where: {
        org_id: params.org_id,
        user_id: params.user_id,
      },
    });

    return product !== null;
  }
}
