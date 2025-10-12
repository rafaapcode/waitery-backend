import { Injectable } from '@nestjs/common';
import { Prisma, Product } from 'generated/prisma';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { UserRole } from 'src/core/domain/entities/user';
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
    org_id: string,
    limit: number,
    offset: number,
  ): Promise<ProductWithCategory[]> {
    const product = await this.prisma.product.findMany({
      take: limit,
      skip: offset,
      where: { org_id },
      include: {
        category: true,
      },
    });

    return product;
  }

  async verifyOrgById(
    org_id: string,
    user_id: string,
    userRole: UserRole,
  ): Promise<boolean> {
    if (userRole === UserRole.OWNER) {
      const product = await this.prisma.organization.findFirst({
        where: {
          owner_id: user_id,
        },
      });

      return product !== null;
    }

    const product = await this.prisma.userOrg.findFirst({
      where: {
        org_id: org_id,
        user_id: user_id,
      },
    });

    return product !== null;
  }

  async getByCategory(
    org_id: string,
    category_id: string,
    limit: number,
    offset: number,
  ): Promise<ProductWithCategory[]> {
    const product = await this.prisma.product.findMany({
      take: limit,
      skip: offset,
      where: {
        org_id,
        category_id,
      },
      include: {
        category: true,
      },
    });

    return product;
  }
}
