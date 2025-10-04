import { Inject, Injectable } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { Order } from 'src/core/domain/entities/order';
import { IORDER_CONTRACT } from 'src/shared/constants';
import { CreateOrderDto } from '../dto/create-order.dto';

interface ICreateOrderUseCase {
  execute(data: CreateOrderDto): Promise<Order>;
}

@Injectable()
export class CreateOrderUseCase implements ICreateOrderUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
  ) {}

  async execute(data: CreateOrderDto): Promise<Order> {
    throw new Error('Method not implemented');
  }
}
