import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';

interface IDeleteCategoryUseCase {
  execute(id: string): Promise<void>;
}

@Injectable()
export class DeleteCategoryUseCase implements IDeleteCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
  ) {}
  async execute(id: string): Promise<void> {
    const catExists = await this.catContract.getCategory(id);

    if (!catExists) throw new NotFoundException('Category not found');

    await this.catContract.delete(id);
  }
}
