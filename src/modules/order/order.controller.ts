import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GetMe } from 'src/common/decorators/GetMe';
import { Roles } from 'src/common/decorators/Role';
import { ParseULIDPipe } from 'src/common/pipes/ParseULIDPipe';
import { UserRole } from 'src/core/domain/entities/user';
import { JwtPayload } from 'src/express';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderUseCase } from './usecases/CancelOrderUseCase';
import { CreateOrderUseCase } from './usecases/CreateOrderUseCase';
import { DeleteOrderUseCase } from './usecases/DeleteOrderUseCase';
import { GetAllOrdersOfTodayUseCase } from './usecases/GetAllOrdersOfTodayUseCase';
import { GetAllOrdersOfOrgUseCase } from './usecases/GetAllOrdersUseCase';
import { GetMyOrderUseCase } from './usecases/GetMyOrdersUseCase';
import { GetOrdersOfUserUseCase } from './usecases/GetOrdersOfUserUseCase';
import { GetOrderUseCase } from './usecases/GetOrderUseCase';
import { UpdateOrderStatusUseCase } from './usecases/UpdateOrderStatusUseCase';

@Controller('order')
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly deleteOrderUseCase: DeleteOrderUseCase,
    private readonly getAllOrdersOfTodayOrderUseCase: GetAllOrdersOfTodayUseCase,
    private readonly getAllOrdersOrderUseCase: GetAllOrdersOfOrgUseCase,
    private readonly getMyOrdersUseCase: GetMyOrderUseCase,
    private readonly getOrdersOfUserUseCase: GetOrdersOfUserUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

  @Post()
  create(@Body() data: CreateOrderDto) {
    return this.createOrderUseCase.execute(data);
  }

  @Patch('cancel/:order_id/:org_id')
  cancelOrder(
    @Param('order_id', ParseULIDPipe) order_id: string,
    @Param('org_id', ParseULIDPipe) org_id: string,
  ) {
    return this.cancelOrderUseCase.execute(order_id, org_id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete('delete/:order_id/:org_id')
  deleteOrder(
    @Param('order_id', ParseULIDPipe) order_id: string,
    @Param('org_id', ParseULIDPipe) org_id: string,
  ) {
    return this.deleteOrderUseCase.execute(order_id, org_id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get('get-all/today')
  getAllOrdersToday(
    @GetMe() me: JwtPayload,
    @Query('org_id', ParseULIDPipe) org_id: string,
    @Query('canceled_orders', ParseBoolPipe) canceled_orders: boolean,
  ) {
    return this.getAllOrdersOfTodayOrderUseCase.execute(
      me.id,
      me.role as UserRole,
      org_id,
      {
        canceled_orders,
      },
    );
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get('get-all/:org_id/:page')
  getAllOrders(
    @Param('org_id', ParseULIDPipe) org_id: string,
    @Param('page', ParseIntPipe) page?: number,
  ) {
    return this.getAllOrdersOrderUseCase.execute({
      org_id,
      page,
    });
  }

  @Get('me/:page')
  getMyOrders(
    @GetMe() me: JwtPayload,
    @Param('page', ParseIntPipe) page?: number,
  ) {
    return this.getMyOrdersUseCase.execute({
      user_id: me.id,
      page,
    });
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get('user/:user_id/:page')
  getOrderOfuser(
    @Param('user_id', ParseULIDPipe) user_id: string,
    @Param('page', ParseIntPipe) page?: number,
  ) {
    return this.getOrdersOfUserUseCase.execute({
      user_id,
      page,
    });
  }

  @Get(':order_id/:org_id')
  getOrder(
    @Param('order_id', ParseULIDPipe) order_id: string,
    @Param('org_id', ParseULIDPipe) org_id: string,
  ) {
    return this.getOrderUseCase.execute(order_id, org_id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.WAITER)
  @Patch(':order_id/:org_id')
  updateOrderStatus(
    @Body() data: UpdateOrderStatusDto,
    @Param('org_id', ParseULIDPipe) org_id: string,
  ) {
    return this.updateOrderStatusUseCase.execute(data, org_id);
  }
}
