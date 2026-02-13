import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IRemoveDiscountToAProductUseCase {
  execute(
    org_id: string,
    product_id: string,
    discounted_price: number,
  ): Promise<void>;
}

@Injectable()
export class RemoveDiscountToProductUseCase implements IRemoveDiscountToAProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(org_id: string, product_id: string): Promise<void> {
    const orgExists = await this.orgService.get({ id: org_id });

    if (!orgExists) throw new NotFoundException('Organization not found');

    const productExists = await this.prodService.get({
      product_id,
      org_id,
    });

    if (!productExists) throw new NotFoundException('Product not found');
  }
}
