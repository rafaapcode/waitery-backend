import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { Product } from 'src/core/domain/entities/product';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IGetAllProductUseCase {
  execute(
    org_id: string,
    page?: number,
  ): Promise<{
    has_next: boolean;
    products: Product[];
  }>;
}

@Injectable()
export class GetAllProductUseCase implements IGetAllProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(
    org_id: string,
    page?: number,
  ): Promise<{
    has_next: boolean;
    products: Product[];
  }> {
    const org_exists = await this.orgService.get({ id: org_id });

    if (!org_exists) throw new NotFoundException('Organization not found');

    const products = await this.prodService.getAll({
      org_id,
      page,
    });

    return products;
  }
}
