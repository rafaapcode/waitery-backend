import { Injectable } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { createOrderEntity, OrderStatus } from 'src/core/domain/entities/order';
import { createProductEntity } from 'src/core/domain/entities/product';
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
  async getOrder(
    id: IOrderContract.GetOrderParams,
  ): Promise<IOrderContract.GetOrderOutput> {
    const order = await this.orderRepo.getOrder(id);

    if (!order) return null;

    // Get Only the products
    const productNormalize = order.products.map((p) => p.product);

    const products = productNormalize.map((p) => {
      const category = {
        org_id: p.org_id,
        name: p.category.name,
        icon: p.category.icon,
      };

      // const ing = createIngredientEntity()

      return createProductEntity({
        ...p,
        ingredients: [],
        category,
      });
    });

    const orderEntity = createOrderEntity({
      ...order,
      status: order.status as OrderStatus,
      deleted_at: order.deleted_at ?? undefined,
      products,
    });

    return orderEntity;
  }
  async getAllOrders(
    params: IOrderContract.GetAllOrdersOfOrgParams,
  ): Promise<IOrderContract.GetAllOrdersOfOrgOutput> {
    const { org_id, page } = params;
    const LIMIT = 25;
    const PAGE = page ? (page >= 0 ? page : 0) : 0;
    const OFFSET = PAGE * LIMIT;

    const orders = await this.orderRepo.getAllOrders(org_id, OFFSET, LIMIT + 1);
    let has_next = false;

    if (orders.length > 25) has_next = true;

    return {
      orders: orders.slice(0, LIMIT).map((order) =>
        createOrderEntity({
          ...order,
          status: order.status as OrderStatus,
          deleted_at: order.deleted_at ?? undefined,
        }),
      ),
      has_next,
    };
  }
  async getAllOrdersOfToday(
    org_id: IOrderContract.GetAllOrdersOfTodayOfOrgParams,
  ): Promise<IOrderContract.GetAllOrdersOfTodayOfOrgOutput> {
    const orders = await this.orderRepo.getAllOrdersOfToday(org_id);

    return orders.map((order) =>
      createOrderEntity({
        ...order,
        status: order.status as OrderStatus,
        deleted_at: order.deleted_at ?? undefined,
      }),
    );
  }
}
