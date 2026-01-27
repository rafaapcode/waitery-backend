import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';

interface IDeleteCategoryUseCase {
  execute(id: string, org_id: string): Promise<void>;
}

@Injectable()
export class DeleteCategoryUseCase implements IDeleteCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
  ) {}
  async execute(id: string, org_id: string): Promise<void> {
    const catExists = await this.catContract.getCategory({ id });

    if (!catExists) throw new NotFoundException('Category not found');

    const belongsToOrg = catExists.org_id === org_id;

    if (!belongsToOrg) {
      throw new BadRequestException(
        'Category does not belong to this organization',
      );
    }

    const hasProducts = await this.catContract.isBeingUsed({
      cat_id: id,
      org_id,
    });

    if (hasProducts) {
      throw new ConflictException(
        'Category is being used by products and cannot be deleted',
      );
    }

    await this.catContract.delete(id);
  }
}
