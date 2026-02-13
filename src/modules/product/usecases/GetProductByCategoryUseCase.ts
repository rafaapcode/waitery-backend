import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { Product } from 'src/core/domain/entities/product';
import {
  ICATEGORY_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IGetProductByCategoryUseCase {
  execute(
    org_id: string,
    category_id: string,
    page?: number,
  ): Promise<{
    has_next: boolean;
    products: Product[];
  }>;
}

@Injectable()
export class GetProductByCategoryUseCase implements IGetProductByCategoryUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(ICATEGORY_CONTRACT)
    private readonly catService: ICategoryContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(
    org_id: string,
    category_id: string,
    page?: number,
  ): Promise<{
    has_next: boolean;
    products: Product[];
  }> {
    const org_exists = await this.orgService.get({ id: org_id });

    if (!org_exists) throw new NotFoundException('Organization not found');

    const cat_exists = await this.catService.getCategory({
      id: category_id,
      orgId: org_id,
    });

    if (!cat_exists) throw new NotFoundException('Category not found');

    const isRelated = cat_exists.org_id === org_id;

    if (!isRelated) throw new NotFoundException('Category not found');

    const products = await this.prodService.getProductsByCategory({
      org_id,
      category_id,
      page,
    });

    return products;
  }
}
