import { Inject, Injectable } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';
import { UpdateProductDto } from '../dto/update-product.dto';

interface IUpdateProductUseCase {
  execute(
    org_id: string,
    product_id: string,
    data: UpdateProductDto,
  ): Promise<void>;
}

@Injectable()
export class UpdateProductUseCase implements IUpdateProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(
    org_id: string,
    product_id: string,
    data: UpdateProductDto,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
