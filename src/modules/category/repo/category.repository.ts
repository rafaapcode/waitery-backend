import { Injectable } from '@nestjs/common';
import { Category } from 'generated/prisma';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category as CategoryEntity } from 'src/core/domain/entities/category';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CategoryEntity): Promise<Category> {
    const category = await this.prismaService.category.create({
      data,
    });

    return category;
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.category.delete({ where: { id } });
  }

  async update(data: ICategoryContract.UpdateParams): Promise<Category> {
    const updated_category = await this.prismaService.category.update({
      where: { id: data.id },
      data: {
        ...(data.category.icon && { icon: data.category.icon }),
        ...(data.category.name && { name: data.category.name }),
      },
    });

    return updated_category;
  }

  async getById(
    data: ICategoryContract.GetCategoryParams,
  ): Promise<Category | null> {
    const updated_category = await this.prismaService.category.findUnique({
      where: { id: data.id, ...(data.orgId && { org_id: data.orgId }) },
    });

    return updated_category;
  }

  async getByName(
    data: ICategoryContract.GetCategoriesByNameParams,
  ): Promise<Category | null> {
    const updated_category = await this.prismaService.category.findFirst({
      where: {
        AND: [{ name: data.name }, { org_id: data.org_id }],
      },
    });

    return updated_category;
  }

  async getAllCategories(
    org_id: ICategoryContract.GetAllCategoriesOfOrgParams,
  ): Promise<Category[]> {
    const updated_category = await this.prismaService.category.findMany({
      where: {
        org_id,
      },
    });

    return updated_category;
  }

  async isBeingUsed(
    data: ICategoryContract.categoryIsBeingUsedParams,
  ): Promise<boolean> {
    const productUsingCategory = await this.prismaService.product.findFirst({
      where: {
        org_id: data.org_id,
        category_id: data.cat_id,
      },
    });

    return productUsingCategory !== null;
  }
}
