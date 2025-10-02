import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category } from 'src/core/domain/entities/category';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';
import { UpdateCategoryDto } from '../dto/update-category.dto';

interface IUpdateCategoryUseCase {
  execute(id: string, data: UpdateCategoryDto): Promise<Category>;
}

@Injectable()
export class UpdateCategoryUseCase implements IUpdateCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
  ) {}
  async execute(id: string, data: UpdateCategoryDto): Promise<Category> {
    const cat_exists = await this.catContract.getCategory(id);

    if (!cat_exists) throw new NotFoundException('Category not found');

    const updated_cat = await this.catContract.update({
      id,
      category: data,
    });

    return updated_cat;
  }
}
