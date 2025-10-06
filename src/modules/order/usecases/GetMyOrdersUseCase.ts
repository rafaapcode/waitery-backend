import { Inject, Injectable } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { Order } from 'src/core/domain/entities/order';
import { IORDER_CONTRACT } from 'src/shared/constants';

interface IGetMyOrderUseCase {
  execute(user_id: string): Promise<Order[]>;
}

@Injectable()
export class GetMyOrderUseCase implements IGetMyOrderUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
  ) {}

  async execute(user_id: string): Promise<Order[]> {
    throw new Error('Method not implemented');
  }
}
