import { Inject, Injectable } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IORDER_CONTRACT } from 'src/shared/constants';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';

interface IUpdateOrderStatusUseCase {
  execute(data: UpdateOrderStatusDto, org_id: string): Promise<void>;
}

@Injectable()
export class UpdateOrderStatusUseCase implements IUpdateOrderStatusUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
  ) {}

  async execute(data: UpdateOrderStatusDto, org_id: string): Promise<void> {
    throw new Error('Method not implemented');
  }
}
