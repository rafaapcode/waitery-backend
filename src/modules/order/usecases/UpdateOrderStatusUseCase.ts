import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IORDER_CONTRACT } from 'src/shared/constants';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';

interface IUpdateOrderStatusUseCase {
  execute(
    data: UpdateOrderStatusDto,
    org_id: string,
    order_id: string,
  ): Promise<void>;
}

@Injectable()
export class UpdateOrderStatusUseCase implements IUpdateOrderStatusUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
  ) {}

  async execute(
    data: UpdateOrderStatusDto,
    org_id: string,
    order_id: string,
  ): Promise<void> {
    const order_exits = await this.orderContract.getOrder(order_id);

    if (!order_exits) throw new NotFoundException('Order not found');

    const order = await this.orderContract.getOrder(order_id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const orgHasOrder = order.org_id === org_id;

    if (!orgHasOrder) throw new NotFoundException('Order not found');

    if (order_exits.status === data.status) {
      throw new ConflictException(
        'The new status must be different from the actual status',
      );
    }

    await this.orderContract.updateOrderStatus({ ...data, order_id });
  }
}
