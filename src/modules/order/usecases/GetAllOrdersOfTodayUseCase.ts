import { Inject, Injectable } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { Order } from 'src/core/domain/entities/order';
import { IORDER_CONTRACT } from 'src/shared/constants';

interface IGetAllOrdersOfTodayUseCase {
  execute(org_id: string): Promise<Order[]>;
}

@Injectable()
export class GetAllOrdersOfTodayUseCase implements IGetAllOrdersOfTodayUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
  ) {}

  async execute(org_id: string): Promise<Order[]> {
    throw new Error('Method not implemented');
  }
}
