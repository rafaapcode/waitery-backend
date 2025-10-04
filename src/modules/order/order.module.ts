import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { IORDER_CONTRACT } from 'src/shared/constants';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './repo/order.repository';
import { CancelOrderUseCase } from './usecases/CancelOrderUseCase';
import { CreateOrderUseCase } from './usecases/CreateOrderUseCase';
import { DeleteOrderUseCase } from './usecases/DeleteOrderUseCase';
import { GetAllOrdersOfTodayUseCase } from './usecases/GetAllOrdersOfTodayUseCase';
import { GetAllOrdersOfOrgUseCase } from './usecases/GetAllOrdersUseCase';
import { GetOrderUseCase } from './usecases/GetOrderUseCase';
import { UpdateOrderStatusUseCase } from './usecases/UpdateOrderStatusUseCase';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderController],
  providers: [
    OrderRepository,
    CancelOrderUseCase,
    CreateOrderUseCase,
    DeleteOrderUseCase,
    GetAllOrdersOfTodayUseCase,
    GetAllOrdersOfOrgUseCase,
    GetOrderUseCase,
    UpdateOrderStatusUseCase,
    {
      provide: IORDER_CONTRACT,
      useClass: OrderService,
    },
  ],
})
export class OrderModule {}
