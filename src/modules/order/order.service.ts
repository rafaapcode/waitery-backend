import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { createCategoryEntity } from 'src/core/domain/entities/category';
import {
  createOrderEntity,
  Order,
  OrderStatus,
} from 'src/core/domain/entities/order';
import { createProductEntity, Product } from 'src/core/domain/entities/product';
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

    return createOrderEntity({
      ...order,
      products: Order.productsFromPrismaJson(
        order.products as Prisma.JsonArray,
      ),
      status: order.status as OrderStatus,
      deleted_at: order.deleted_at ?? undefined,
    });
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

    const orderEntity = createOrderEntity({
      ...order,
      status: order.status as OrderStatus,
      deleted_at: order.deleted_at ?? undefined,
      products: Order.productsFromPrismaJson(
        order.products as Prisma.JsonArray,
      ),
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

    if (orders.length > LIMIT) has_next = true;

    return {
      orders: orders.slice(0, LIMIT).map((order) =>
        createOrderEntity({
          ...order,
          status: order.status as OrderStatus,
          products: [],
          deleted_at: order.deleted_at ?? undefined,
        }),
      ),
      has_next,
    };
  }

  async getAllOrdersOfToday(
    params: IOrderContract.GetAllOrdersOfTodayOfOrgParams,
  ): Promise<IOrderContract.GetAllOrdersOfTodayOfOrgOutput> {
    const orders = await this.orderRepo.getAllOrdersOfToday(params);

    return orders.map((order) =>
      createOrderEntity({
        ...order,
        status: order.status as OrderStatus,
        products: [],
        deleted_at: order.deleted_at ?? undefined,
      }),
    );
  }

  async verifyOrderByOrg(
    params: IOrderContract.VerifyOrgOrderParams,
  ): Promise<IOrderContract.VerifyOrgOrdersOutput> {
    const order = await this.orderRepo.verifyOrder(params.order_id, {
      org_id: params.org_id,
    });

    return order !== null;
  }

  async verifyOrderByUser(
    params: IOrderContract.VerifyUserOrderParams,
  ): Promise<IOrderContract.VerifyUserOrdersOutput> {
    const order = await this.orderRepo.verifyOrder(params.order_id, {
      user_id: params.user_id,
    });

    return order !== null;
  }

  async getProductsOfOrder(
    products_info: IOrderContract.GetProductsOfOrdersParams,
  ): Promise<IOrderContract.GetProductsOfOrdersOutput> {
    const products = (
      await this.orderRepo.getProductsOfOrder(products_info)
    ).map((p) =>
      createProductEntity({
        ...p,
        ingredients: Product.toCategoryIngredients(
          p.ingredients as Prisma.JsonArray,
        ),
        category: createCategoryEntity({
          ...p.category,
        }),
      }),
    );

    const mapProduct = new Map<string, number>();

    products_info.forEach((p) => mapProduct.set(p.product_id, p.quantity));

    return products.map((p) => p.toOrderType(mapProduct.get(p.id!)));
  }

  async getOrderOfUser(
    params: IOrderContract.GetOrdersOfUserParams,
  ): Promise<IOrderContract.GetOrdersOfUserOutput> {
    const { user_id, page } = params;
    const LIMIT = 25;
    const PAGE = page ? (page >= 0 ? page : 0) : 0;
    const OFFSET = PAGE * LIMIT;

    const orders = await this.orderRepo.getOrdersOfUser(
      user_id,
      OFFSET,
      LIMIT + 1,
    );
    let has_next = false;

    if (orders.length > 25) has_next = true;

    return {
      has_next,
      orders: orders.slice(0, LIMIT).map((order) =>
        createOrderEntity({
          ...order,
          status: order.status as OrderStatus,
          products: Order.productsFromPrismaJson(
            order.products as Prisma.JsonArray,
          ),
          deleted_at: order.deleted_at ?? undefined,
        }),
      ),
    };
  }
}

// image_url?: string;
//   name: string;
//   quantity: number;
//   price: number;
//   category: string;
//   discount: boolean;
