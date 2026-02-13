import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import {
  IINGREDIENT_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IAddDiscountToAProductUseCase {
  execute(
    org_id: string,
    product_id: string,
    discounted_price: number,
  ): Promise<void>;
}

@Injectable()
export class AddDiscountToProductUseCase implements IAddDiscountToAProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingService: IIngredientContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(
    org_id: string,
    product_id: string,
    discounted_price: number,
  ): Promise<void> {
    const orgExists = await this.orgService.get({ id: org_id });

    if (!orgExists) throw new NotFoundException('Organization not found');

    const productExists = await this.prodService.get({
      product_id,
      org_id,
    });

    if (!productExists) throw new NotFoundException('Product not found');

    await this.prodService.addDiscount({
      discounted_price,
      org_id,
      product_id,
    });
  }
}
