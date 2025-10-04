import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IORDER_CONTRACT } from 'src/shared/constants';

interface ICancelOrderUseCase {
  execute(order_id: string, org_id: string): Promise<void>;
}

@Injectable()
export class CancelOrderUseCase implements ICancelOrderUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
  ) {}

  async execute(order_id: string, org_id: string): Promise<void> {
    const orderIsLinkedWithOrg = await this.orderContract.verifyOrderByOrg({
      order_id,
      org_id,
    });

    if (!orderIsLinkedWithOrg) {
      throw new NotFoundException('Order is not from this org');
    }

    await this.orderContract.cancelOrder(order_id);
  }
}
