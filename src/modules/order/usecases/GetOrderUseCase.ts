import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { Order } from 'src/core/domain/entities/order';
import { IORDER_CONTRACT } from 'src/shared/constants';

interface IGetOrderUseCase {
  execute(order_id: string, org_id: string): Promise<Order>;
}

@Injectable()
export class GetOrderUseCase implements IGetOrderUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
  ) {}

  async execute(order_id: string, org_id: string): Promise<Order> {
    const orgHasOrder = await this.orderContract.verifyOrderByOrg({
      order_id,
      org_id,
    });

    if (!orgHasOrder) {
      throw new NotFoundException('Orders is not from this org');
    }

    const order = await this.orderContract.getOrder(order_id);

    if (!order) throw new NotFoundException('Order not found');

    return order;
  }
}
