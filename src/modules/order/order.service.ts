import { Injectable } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { OrderRepository } from './repo/order.repository';

@Injectable()
export class OrderService implements IOrderContract {
  constructor(private readonly orderRepo: OrderRepository) {}

  async cancelOrder(
    order_id: IOrderContract.DeleteParams,
  ): Promise<IOrderContract.DeleteOutput> {
    await this.orderRepo.cancel(order_id);
  }
  async deleteOrder(
    order_id: IOrderContract.DeleteParams,
  ): Promise<IOrderContract.DeleteOutput> {
    await this.orderRepo.delete(order_id);
  }
  async create(
    data: IOrderContract.CreateParams,
  ): Promise<IOrderContract.CreateOutput> {
    const order = await this.orderRepo.create(data);
    data.id = order.id;
    return data;
  }
  async updateOrderStatus(
    params: IOrderContract.UpdateOrderStatusParams,
  ): Promise<IOrderContract.UpdateOrderStatusOutput> {
    await this.orderRepo.updateOrder(params.order_id, params.status);
  }
  getOrder(
    id: IOrderContract.GetOrderParams,
  ): Promise<IOrderContract.GetOrderOutput> {
    throw new Error('Method not implemented');
  }
  getAllOrders(
    org_id: IOrderContract.GetAllOrdersOfOrgParams,
  ): Promise<IOrderContract.GetAllOrdersOfOrgOutput> {
    throw new Error('Method not implemented');
  }
  getAllOrdersOfToday(
    org_id: IOrderContract.GetAllOrdersOfTodayOfOrgParams,
  ): Promise<IOrderContract.GetAllOrdersOfTodayOfOrgOutput> {
    throw new Error('Method not implemented');
  }
}
