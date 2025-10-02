import { Inject, Injectable } from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category } from 'src/core/domain/entities/category';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';

interface IGetByIdCategoryUseCase {
  execute(id: string): Promise<Category>;
}

@Injectable()
export class GetByIdCategoryUseCase implements IGetByIdCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
  ) {}
  execute(id: string): Promise<Category> {
    throw new Error('Method not implemented.');
  }
}
