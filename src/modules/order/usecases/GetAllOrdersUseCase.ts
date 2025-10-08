import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Order } from 'src/core/domain/entities/order';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';

interface IGetAllOrdersOfOrgUseCase {
  execute(params: { org_id: string; page?: number }): Promise<{
    has_next: boolean;
    orders: Order[];
  }>;
}

@Injectable()
export class GetAllOrdersOfOrgUseCase implements IGetAllOrdersOfOrgUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
  ) {}

  async execute(params: { org_id: string; page?: number }): Promise<{
    has_next: boolean;
    orders: Order[];
  }> {
    const orgExists = await this.orgContract.get({ id: params.org_id });

    if (!orgExists) {
      throw new NotFoundException('Org not found');
    }

    const orders = await this.orderContract.getAllOrders(params);

    return orders;
  }
}
