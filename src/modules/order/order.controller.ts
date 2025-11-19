import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GetMe } from 'src/common/decorators/GetMe';
import { GetOrgId } from 'src/common/decorators/GetOrgId';
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

  @Patch('cancel/:order_id')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('order_id', ParseULIDPipe) order_id: string,
    @GetOrgId() org_id: string,
  ) {
    await this.cancelOrderUseCase.execute(order_id, org_id);
    return { message: 'Order cancelled with success!' };
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete('delete/:order_id')
  @HttpCode(HttpStatus.OK)
  async deleteOrder(
    @Param('order_id', ParseULIDPipe) order_id: string,
    @GetOrgId() org_id: string,
  ) {
    await this.deleteOrderUseCase.execute(order_id, org_id);
    return { message: 'Delete cancelled with success!' };
  }

  @Get('get-all/today')
  @HttpCode(HttpStatus.OK)
  getAllOrdersToday(
    @GetMe() me: JwtPayload,
    @GetOrgId() org_id: string,
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
  @Get('get-all/page/:page')
  @HttpCode(HttpStatus.OK)
  getAllOrders(
    @GetOrgId() org_id: string,
    @Param('page', ParseIntPipe) page?: number,
  ) {
    return this.getAllOrdersOrderUseCase.execute({
      org_id,
      page,
    });
  }

  @Get('me/:page')
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
  getOrderOfuser(
    @Param('user_id', ParseULIDPipe) user_id: string,
    @Param('page', ParseIntPipe) page?: number,
  ) {
    return this.getOrdersOfUserUseCase.execute({
      user_id,
      page,
    });
  }

  @Get(':order_id')
  @HttpCode(HttpStatus.OK)
  getOrder(
    @Param('order_id', ParseULIDPipe) order_id: string,
    @GetOrgId() org_id: string,
  ) {
    return this.getOrderUseCase.execute(order_id, org_id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.WAITER)
  @Patch(':order_id')
  @HttpCode(HttpStatus.OK)
  async updateOrderStatus(
    @Body() data: UpdateOrderStatusDto,
    @Param('order_id', ParseULIDPipe) order_id: string,
    @GetOrgId() org_id: string,
  ) {
    await this.updateOrderStatusUseCase.execute(data, org_id, order_id);
    return { message: 'Order updated with success !' };
  }
}
