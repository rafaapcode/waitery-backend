import { Inject, Injectable } from '@nestjs/common';
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
  execute(id: string, data: UpdateCategoryDto): Promise<Category> {
    throw new Error('Method not implemented.');
  }
}
