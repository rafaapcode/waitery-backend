import { Inject, Injectable } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { Product } from 'src/core/domain/entities/product';
import { UserRole } from 'src/core/domain/entities/user';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IGetAllProductUseCase {
  execute(
    user_id: string,
    role: UserRole,
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
    throw new Error('Method not implemented.');
  }
}
