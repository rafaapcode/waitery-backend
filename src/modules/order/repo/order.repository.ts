import { Injectable } from '@nestjs/common';
import { Order } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class OrderRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: IOrderContract.CreateParams): Promise<Order> {
    throw new Error('teste');
  }

  delete(order_id: string): Promise<Order> {
    throw new Error('teste');
  }
}
