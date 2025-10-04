import { Inject, Injectable } from '@nestjs/common';
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
    throw new Error('Method not implemented');
  }
}
