import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Category } from 'src/core/domain/entities/category';
import {
  ICATEGORY_CONTRACT,
  IORGANIZATION_CONTRACT,
} from 'src/shared/constants';

interface IGetAllCategoryUseCase {
  execute(org_id: string): Promise<Category[]>;
}

@Injectable()
export class GetAllCategoryUseCase implements IGetAllCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
  ) {}
  async execute(org_id: string): Promise<Category[]> {
    const orgExists = await this.orgContract.get({
      id: org_id,
    });

    if (!orgExists) throw new NotFoundException('Organization not found');

    const allCats = await this.catContract.getAllCategories(org_id);

    return allCats;
  }
}
