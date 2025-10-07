import { Test, TestingModule } from '@nestjs/testing';
import {
  createOrderEntity,
  Order,
  OrderStatus,
} from 'src/core/domain/entities/order';
import { createProductEntity } from 'src/core/domain/entities/product';
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
            verifyOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    orderRepo = module.get<OrderRepository>(OrderRepository);
  });

  beforeEach(() => jest.clearAllMocks());

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
      products: [],
    });

    // Act
    const order = await orderService.create(data);

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(orderRepo.create).toHaveBeenCalledTimes(1);
    expect(orderRepo.create).toHaveBeenCalledWith(data);
  });

  it('Should create a new order with products', async () => {
    // Arrange
    const prods = Array.from({ length: 5 }).map((_, idx) =>
      createProductEntity({
        category: {
          icon: '😊',
          name: 'teste',
          org_id: '1231231',
        },
        description: 'Descrição teste',
        discount: false,
        discounted_price: 0,
        image_url: 'http:',
        ingredients: [],
        name: 'Produto bom',
        org_id: '1231231',
        price: 120,
        id: `${idx}`.repeat(11),
      }),
    );
    const data = createOrderEntity({
      org_id: '1231231',
      products: prods.map((p, idx) => p.toOrderType(idx + 1)),
      quantity: 10,
      status: OrderStatus.DONE,
      table: '12',
      total_price: 120,
      user_id: 'rafael_123123',
      id: 'order_1123132uid',
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
      products: [],
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
      products: [],
      status: OrderStatus.DONE,
      table: '12',
      total_price: 120,
      user_id: 'rafael_123123',
      created_at: new Date(),
      deleted_at: null,
      id: '1231321',
    });

    // Act
    const order = await orderService.getOrder('1231321');

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(orderRepo.getOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.getOrder).toHaveBeenCalledWith('1231321');
  });

  it('Should return null if a order does not exists', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getOrder').mockResolvedValue(null);

    // Act
    const order = await orderService.getOrder('1231231');

    // Assert
    expect(order).toBeNull();
    expect(orderRepo.getOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.getOrder).toHaveBeenCalledWith('1231231');
  });

  it('Should return all orders of page 0', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getAllOrders').mockResolvedValue(
      Array.from({ length: 26 }).map((_, idx) => ({
        org_id: `${idx}`.repeat(10),
        quantity: 10,
        status: OrderStatus.DONE,
        table: `${idx}`.repeat(2),
        total_price: idx * 4.5,
        user_id: `rafael_123123-${idx}`,
        created_at: new Date(),
        deleted_at: null,
        id: `${idx}`.repeat(5),
        products: [],
      })),
    );

    // Act
    const { orders, has_next } = await orderService.getAllOrders({
      org_id: '123123123',
      page: 0,
    });

    // Assert
    expect(has_next).toBeTruthy();
    expect(orders.length).toBe(25);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orderRepo.getAllOrders).toHaveBeenCalledTimes(1);
    expect(orderRepo.getAllOrders).toHaveBeenCalledWith('123123123', 0, 26);
  });

  it('Should return all orders of page 1', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getAllOrders').mockResolvedValue(
      Array.from({ length: 3 }).map((_, idx) => ({
        org_id: `${idx}`.repeat(10),
        quantity: 10,
        status: OrderStatus.DONE,
        table: `${idx}`.repeat(2),
        total_price: idx * 4.5,
        user_id: `rafael_123123-${idx}`,
        created_at: new Date(),
        deleted_at: null,
        id: `${idx}`.repeat(5),
        products: [],
      })),
    );

    // Act
    const { orders, has_next } = await orderService.getAllOrders({
      org_id: '123123123',
      page: 1,
    });

    // Assert
    expect(has_next).toBeFalsy();
    expect(orders.length).toBe(3);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orderRepo.getAllOrders).toHaveBeenCalledTimes(1);
    expect(orderRepo.getAllOrders).toHaveBeenCalledWith('123123123', 25, 26);
  });

  it('Should return all orders of page 0 if the page is not defined', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getAllOrders').mockResolvedValue(
      Array.from({ length: 3 }).map((_, idx) => ({
        org_id: `${idx}`.repeat(10),
        quantity: 10,
        status: OrderStatus.DONE,
        table: `${idx}`.repeat(2),
        total_price: idx * 4.5,
        user_id: `rafael_123123-${idx}`,
        created_at: new Date(),
        deleted_at: null,
        id: `${idx}`.repeat(5),
        products: [],
      })),
    );

    // Act
    const { orders, has_next } = await orderService.getAllOrders({
      org_id: '123123123',
    });

    // Assert
    expect(has_next).toBeFalsy();
    expect(orders.length).toBe(3);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orderRepo.getAllOrders).toHaveBeenCalledTimes(1);
    expect(orderRepo.getAllOrders).toHaveBeenCalledWith('123123123', 0, 26);
  });

  it('Should return all orders of today', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getAllOrdersOfToday').mockResolvedValue(
      Array.from({ length: 3 }).map((_, idx) => ({
        org_id: `${idx}`.repeat(10),
        quantity: 10,
        status: OrderStatus.DONE,
        table: `${idx}`.repeat(2),
        total_price: idx * 4.5,
        user_id: `rafael_123123-${idx}`,
        created_at: new Date(),
        deleted_at: null,
        id: `${idx}`.repeat(5),
        products: [],
      })),
    );

    // Act
    const orders = await orderService.getAllOrdersOfToday({
      org_id: '123123123',
      orders_canceled: true,
    });

    // Assert
    expect(orders.length).toBe(3);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orderRepo.getAllOrdersOfToday).toHaveBeenCalledTimes(1);
    expect(orderRepo.getAllOrdersOfToday).toHaveBeenCalledWith({
      orders_canceled: true,
      org_id: '123123123',
    });
  });

  it('Should return true if the order of a org exists', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'verifyOrder').mockResolvedValue({
      org_id: '1231231',
      quantity: 10,
      status: OrderStatus.DONE,
      table: '12',
      total_price: 120,
      user_id: 'rafael_123123',
      created_at: new Date(),
      deleted_at: null,
      id: '1231321',
      products: [],
    });

    // Act
    const isOrderOfOrg = await orderService.verifyOrderByOrg({
      order_id: '1231321',
      org_id: '1231231',
    });

    // Assert
    expect(isOrderOfOrg).toBeTruthy();
    expect(orderRepo.verifyOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.verifyOrder).toHaveBeenCalledWith('1231321', {
      org_id: '1231231',
    });
  });

  it('Should return false if the order of a org does not exists', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'verifyOrder').mockResolvedValue(null);

    // Act
    const isOrderOfOrg = await orderService.verifyOrderByOrg({
      order_id: '1231321',
      org_id: '1231231',
    });

    // Assert
    expect(isOrderOfOrg).toBeFalsy();
    expect(orderRepo.verifyOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.verifyOrder).toHaveBeenCalledWith('1231321', {
      org_id: '1231231',
    });
  });

  it('Should return true if the order of a user exists', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'verifyOrder').mockResolvedValue({
      org_id: '1231231',
      quantity: 10,
      status: OrderStatus.DONE,
      table: '12',
      total_price: 120,
      user_id: 'rafael_123123',
      created_at: new Date(),
      deleted_at: null,
      id: '1231321',
      products: [],
    });

    // Act
    const isOrderOfOrg = await orderService.verifyOrderByUser({
      order_id: '1231321',
      user_id: '1231231',
    });

    // Assert
    expect(isOrderOfOrg).toBeTruthy();
    expect(orderRepo.verifyOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.verifyOrder).toHaveBeenCalledWith('1231321', {
      user_id: '1231231',
    });
  });

  it('Should return false if the order of a user does not exists', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'verifyOrder').mockResolvedValue(null);

    // Act
    const isOrderOfOrg = await orderService.verifyOrderByUser({
      order_id: '1231321',
      user_id: '1231231',
    });

    // Assert
    expect(isOrderOfOrg).toBeFalsy();
    expect(orderRepo.verifyOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.verifyOrder).toHaveBeenCalledWith('1231321', {
      user_id: '1231231',
    });
  });
});
