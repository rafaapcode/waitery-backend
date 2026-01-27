import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category } from 'src/core/domain/entities/category';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';
import { UpdateCategoryDto } from '../dto/update-category.dto';

interface IUpdateCategoryUseCase {
  execute(
    id: string,
    org_id: string,
    data: UpdateCategoryDto,
  ): Promise<Category>;
}

@Injectable()
export class UpdateCategoryUseCase implements IUpdateCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
  ) {}
  async execute(
    id: string,
    org_id: string,
    data: UpdateCategoryDto,
  ): Promise<Category> {
    const cat_exists = await this.catContract.getCategory({
      id,
      orgId: org_id,
    });

    if (!cat_exists) throw new NotFoundException('Category not found');

    const belongsToOrg = cat_exists.org_id === org_id;

    if (!belongsToOrg) {
      throw new BadRequestException(
        'Category does not belong to this organization',
      );
    }

    const updated_cat = await this.catContract.update({
      id,
      category: data,
    });

    return updated_cat;
  }
}
