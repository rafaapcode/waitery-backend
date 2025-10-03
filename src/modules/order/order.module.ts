import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './repo/order.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderRepository, OrderController],
  providers: [OrderService],
})
export class OrderModule {}
