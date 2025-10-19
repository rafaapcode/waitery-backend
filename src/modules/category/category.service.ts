import { Injectable } from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { createCategoryEntity } from 'src/core/domain/entities/category';
import { CategoryRepository } from './repo/category.repository';

@Injectable()
export class CategoryService implements ICategoryContract {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  async create(
    data: ICategoryContract.CreateParams,
  ): Promise<ICategoryContract.CreateOutput> {
    const newCat = await this.categoryRepo.create(data);

    return createCategoryEntity(newCat);
  }
  async update(
    data: ICategoryContract.UpdateParams,
  ): Promise<ICategoryContract.UpdateOutput> {
    const updatecategory = await this.categoryRepo.update(data);

    return createCategoryEntity(updatecategory);
  }
  async delete(
    data: ICategoryContract.DeleteParams,
  ): Promise<ICategoryContract.DeleteOutput> {
    await this.categoryRepo.delete(data);
  }
  async getCategory(
    data: ICategoryContract.GetCategoryParams,
  ): Promise<ICategoryContract.GetCategoryOutput> {
    const cat = await this.categoryRepo.getById(data);

    if (!cat) return null;

    return createCategoryEntity(cat);
  }
  async getAllCategories(
    data: ICategoryContract.GetAllCategoriesOfOrgParams,
  ): Promise<ICategoryContract.GetAllCategoriesOfOrgOutput> {
    const allCats = await this.categoryRepo.getAllCategories(data);

    return allCats.map((c) => createCategoryEntity(c));
  }
  async getCategoryByName(
    data: ICategoryContract.GetCategoriesByNameParams,
  ): Promise<ICategoryContract.GetCategoriesByNameOutput> {
    const cat = await this.categoryRepo.getByName(data);

    return cat ? createCategoryEntity(cat) : cat;
  }

  async isBeingUsed(
    data: ICategoryContract.categoryIsBeingUsedParams,
  ): Promise<ICategoryContract.categoryIsBeingUsedOutput> {
    return this.categoryRepo.isBeingUsed(data);
  }
}
