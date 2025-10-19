import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category } from 'src/core/domain/entities/category';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';

interface IGetByIdCategoryUseCase {
  execute(id: string, org_id: string): Promise<Category>;
}

@Injectable()
export class GetByIdCategoryUseCase implements IGetByIdCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
  ) {}
  async execute(id: string, org_id: string): Promise<Category> {
    const cat = await this.catContract.getCategory(id);

    if (!cat) throw new NotFoundException('Category not found');

    if (cat.org_id !== org_id) {
      throw new ConflictException(
        'Category does not belong to this organization',
      );
    }

    return cat;
  }
}
