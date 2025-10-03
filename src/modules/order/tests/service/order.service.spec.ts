import { Test, TestingModule } from '@nestjs/testing';
import {
  createOrderEntity,
  Order,
  OrderStatus,
} from 'src/core/domain/entities/order';
import { OrderService } from '../../order.service';
import { OrderRepository } from '../../repo/order.repository';

describe('Order Service', () => {
  let orderService: OrderService;
  let orderRepo: OrderRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: OrderRepository,
          useValue: {
            create: jest.fn(),
            cancel: jest.fn(),
            delete: jest.fn(),
            getOrder: jest.fn(),
            getAllOrders: jest.fn(),
            getAllOrdersOfToday: jest.fn(),
            linkOrderToProduct: jest.fn(),
            updateOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    orderRepo = module.get<OrderRepository>(OrderRepository);
  });

  it('Should all services be defined', () => {
    expect(orderService).toBeDefined();
    expect(orderRepo).toBeDefined();
  });

  it('Should create a new order', async () => {
    // Arrange
    const data = createOrderEntity({
      org_id: '1231231',
      products: [],
      quantity: 10,
      status: OrderStatus.DONE,
      table: '12',
      total_price: 120,
      user_id: 'rafael_123123',
    });
    jest.spyOn(orderRepo, 'create').mockResolvedValue({
      org_id: '1231231',
      quantity: 10,
      status: OrderStatus.DONE,
      table: '12',
      total_price: 120,
      user_id: 'rafael_123123',
      created_at: new Date(),
      deleted_at: null,
      id: '1231321',
    });

    // Act
    const order = await orderService.create(data);

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(orderRepo.create).toHaveBeenCalledTimes(1);
    expect(orderRepo.create).toHaveBeenCalledWith(data);
  });

  it('Should delete a order', async () => {
    // Arrange
    const order_id = 'order_1231123';
    jest.spyOn(orderRepo, 'delete').mockResolvedValue();

    // Act
    await orderService.deleteOrder(order_id);

    // Assert
    expect(orderRepo.delete).toHaveBeenCalledTimes(1);
    expect(orderRepo.delete).toHaveBeenCalledWith(order_id);
  });

  it('Should cancel a order', async () => {
    // Arrange
    const order_id = 'order_1231123';
    jest.spyOn(orderRepo, 'cancel').mockResolvedValue();

    // Act
    await orderService.cancelOrder(order_id);

    // Assert
    expect(orderRepo.cancel).toHaveBeenCalledTimes(1);
    expect(orderRepo.cancel).toHaveBeenCalledWith(order_id);
  });

  it('Should update the status of a order', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'updateOrder').mockResolvedValue();

    // Act
    await orderService.updateOrderStatus({
      order_id: '1231321',
      status: OrderStatus.DONE,
    });

    // Assert
    expect(orderRepo.updateOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.updateOrder).toHaveBeenCalledWith(
      '1231321',
      OrderStatus.DONE,
    );
  });

  it('Should get a order', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getOrder').mockResolvedValue({
      org_id: '1231231',
      quantity: 10,
      status: OrderStatus.DONE,
      table: '12',
      total_price: 120,
      user_id: 'rafael_123123',
      created_at: new Date(),
      deleted_at: null,
      id: '1231321',
    });

    // Act
    const order = await orderService.getOrder('1231231');

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(orderRepo.getOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.getOrder).toHaveBeenCalledWith('1231321');
  });
});
