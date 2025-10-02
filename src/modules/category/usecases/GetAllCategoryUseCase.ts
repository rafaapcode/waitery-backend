import { Inject, Injectable } from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category } from 'src/core/domain/entities/category';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';

interface IGetAllCategoryUseCase {
  execute(org_id: string): Promise<Category[]>;
}

@Injectable()
export class GetAllCategoryUseCase implements IGetAllCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
  ) {}
  execute(org_id: string): Promise<Category[]> {
    throw new Error('Method not implemented.');
  }
}
