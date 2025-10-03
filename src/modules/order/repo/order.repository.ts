import { Injectable } from '@nestjs/common';
import { Order } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { OrderStatus } from 'src/core/domain/entities/order';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class OrderRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: IOrderContract.CreateParams): Promise<Order> {
    const order = await this.prismaService.order.create({
      data: {
        org_id: data.org_id,
        user_id: data.user_id,
        status: data.status,
        total_price: data.total_price,
        quantity: data.quantity,
        table: data.table,
        created_at: data.created_at,
      },
    });

    return order;
  }

  async cancel(order_id: string): Promise<void> {
    await this.prismaService.order.update({
      where: {
        id: order_id,
      },
      data: {
        deleted_at: new Date(),
        status: OrderStatus.CANCELED,
      },
    });
  }

  async delete(order_id: string): Promise<void> {
    await this.prismaService.order.delete({
      where: {
        id: order_id,
      },
    });

    await this.prismaService.productOrder.deleteMany({
      where: {
        order_id,
      },
    });
  }

  async getOrder(order_id: string): Promise<Order | null> {
    const order = await this.prismaService.order.findUnique({
      where: {
        id: order_id,
      },
      include: {
        products: true,
      },
    });

    return order;
  }

  async updateOrder(order_id: string, new_status: OrderStatus): Promise<void> {
    await this.prismaService.order.update({
      where: {
        id: order_id,
      },
      data: {
        status: new_status,
      },
    });
  }

  async getAllOrders(
    org_id: string,
    offset: number,
    limit: number,
  ): Promise<Order[]> {
    const orders = await this.prismaService.order.findMany({
      take: limit,
      skip: offset,
      where: {
        org_id,
      },
    });

    return orders;
  }

  async getAllOrdersOfToday(
    org_id: IOrderContract.GetAllOrdersOfTodayOfOrgParams,
  ): Promise<Order[]> {
    const date = new Date();
    const todayDay = date.getDate();
    const actualMonth = date.getMonth();
    const actualYear = date.getFullYear();

    const orders = await this.prismaService.order.findMany({
      where: {
        org_id,
        created_at: {
          gt: new Date(actualYear, actualMonth, todayDay, 0, 0),
        },
      },
    });

    return orders;
  }

  async linkOrderToProduct(
    org_id: string,
    order_id: string,
    product_ids: string[],
  ): Promise<void> {
    await this.prismaService.productOrder.createMany({
      data: product_ids.map((p_id) => ({
        org_id,
        order_id,
        product_id: p_id,
      })),
    });
  }
}
