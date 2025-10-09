import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { createOrderEntity, Order } from 'src/core/domain/entities/order';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';
import { CreateOrderDto } from '../dto/create-order.dto';

interface ICreateOrderUseCase {
  execute(data: CreateOrderDto): Promise<Order>;
}

@Injectable()
export class CreateOrderUseCase implements ICreateOrderUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
  ) {}

  async execute(data: CreateOrderDto): Promise<Order> {
    const orgExists = await this.orgContract.get({ id: data.org_id });

    if (!orgExists) {
      throw new NotFoundException('Organization not found');
    }

    if (data.products.length === 0) {
      throw new BadRequestException('Products are required');
    }

    const { quantity, total_price } = Order.totalQuantityAndPrice(
      data.products,
    );

    const products_info = data.products.map((p) => ({
      product_id: p.product_id,
      quantity: p.quantity,
    }));
    const products = await this.orderContract.getProductsOfOrder(products_info);

    const order = createOrderEntity({
      org_id: data.org_id,
      table: data.table,
      user_id: data.user_id,
      quantity: quantity,
      total_price: total_price,
      products,
    });

    console.log('Orders', order);

    const new_order = await this.orderContract.create(order);

    return new_order;
  }
}
