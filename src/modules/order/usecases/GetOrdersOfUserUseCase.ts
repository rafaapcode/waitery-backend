import { Inject, Injectable } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { Order } from 'src/core/domain/entities/order';
import { IORDER_CONTRACT } from 'src/shared/constants';

interface IGetOrdersOfUserUseCase {
  execute(params: { user_id: string; page?: number }): Promise<{
    has_next: boolean;
    orders: Order[];
  }>;
}

@Injectable()
export class GetOrdersOfUserUseCase implements IGetOrdersOfUserUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
  ) {}

  async execute(params: { user_id: string; page?: number }): Promise<{
    has_next: boolean;
    orders: Order[];
  }> {
    const orders = await this.orderContract.getOrderOfUser(params);

    return orders;
  }
}
