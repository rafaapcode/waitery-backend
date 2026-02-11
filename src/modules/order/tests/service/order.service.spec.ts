jest.mock('src/shared/config/env', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret-key',
    REFRESH_JWT_SECRET: 'test-refresh-jwt-secret',
    PORT: '3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    CEP_SERVICE_API_URL: 'https://test-cep-api.com',
    CDN_URL: 'https://test-cdn.com',
    BUCKET_NAME: 'test-bucket',
    NODE_ENV: 'test',
    OPEN_STREET_MAP_URL: 'https://nominatim_teste.openstreetmap.org/search',
  },
}));

import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { createCategoryEntity } from 'src/core/domain/entities/category';
import {
  createOrderEntity,
  Order,
  OrderStatus,
} from 'src/core/domain/entities/order';
import { createProductEntity } from 'src/core/domain/entities/product';
import { IORDER_WS_CONTRACT, ISTORAGE_SERVICE } from 'src/shared/constants';
import { OrderService } from '../../order.service';
import { OrderRepository } from '../../repo/order.repository';

describe('Order Service', () => {
  let orderService: OrderService;
  let orderRepo: OrderRepository;
  let storageService: IStorageGw;
  let wsGateway: IOrderWSContract;

  const orgId = faker.string.uuid();
  const userId = faker.string.uuid();
  const orderId1 = faker.string.uuid();
  const orderId2 = faker.string.uuid();
  const orderId3 = faker.string.uuid();
  const categoryId = faker.string.uuid();
  const categoryIcon = faker.internet.emoji();
  const categoryName = faker.lorem.word();
  const productDescription = faker.lorem.sentence();
  const productImageUrl = faker.internet.url();
  const productName = faker.commerce.productName();
  const productPrice = faker.number.float({
    min: 10,
    max: 500,
    fractionDigits: 2,
  });
  const orderQuantity = faker.number.int({ min: 1, max: 10 });
  const orderTable = `Mesa ${faker.number.int({ min: 1, max: 50 })}`;
  const orderTotalPrice = faker.number.float({
    min: 50,
    max: 1000,
    fractionDigits: 2,
  });
  const orderStatus = OrderStatus.DONE;
  const orgId2 = faker.string.uuid();

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
            restartsTheOrdersOfDay: jest.fn(),
          },
        },
        {
          provide: IORDER_WS_CONTRACT,
          useValue: {
            emitCreateOrder: jest.fn(),
          },
        },
        {
          provide: ISTORAGE_SERVICE,
          useValue: {
            deleteFile: jest.fn(),
            getFileUrl: jest.fn(),
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    wsGateway = module.get<IOrderWSContract>(IORDER_WS_CONTRACT);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
  });

  beforeEach(() => jest.clearAllMocks());

  it('Should all services be defined', () => {
    expect(orderService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(wsGateway).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should create a new order', async () => {
    // Arrange
    const data = createOrderEntity({
      org_id: orgId,
      products: [],
      quantity: orderQuantity,
      status: orderStatus,
      table: orderTable,
      total_price: orderTotalPrice,
      user_id: userId,
    });
    jest.spyOn(orderRepo, 'create').mockResolvedValue({
      org_id: orgId,
      quantity: orderQuantity,
      status: orderStatus,
      table: orderTable,
      total_price: orderTotalPrice,
      user_id: userId,
      created_at: new Date(),
      deleted_at: null,
      id: orderId1,
      products: [],
    });

    // Act
    const order = await orderService.create(data);

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(wsGateway.emitCreateOrder).toHaveBeenCalledTimes(1);
    expect(wsGateway.emitCreateOrder).toHaveBeenCalledWith({
      event: `order-org-${orgId}`,
      data: {
        action: 'new_order',
        order: order,
      },
    });
    expect(orderRepo.create).toHaveBeenCalledTimes(1);
    expect(orderRepo.create).toHaveBeenCalledWith(data);
  });

  it('Should create a new order with products', async () => {
    // Arrange
    const prods = Array.from({ length: 5 }).map((_, idx) =>
      createProductEntity({
        category: createCategoryEntity({
          icon: categoryIcon,
          name: categoryName,
          org_id: orgId,
          id: categoryId,
        }),
        description: productDescription,
        discount: false,
        discounted_price: 0,
        image_url: productImageUrl,
        ingredients: [],
        name: productName,
        org_id: orgId,
        price: productPrice,
        id: `${idx}`.repeat(11),
      }),
    );
    const data = createOrderEntity({
      org_id: orgId,
      products: prods.map((p, idx) => p.toOrderType(idx + 1)),
      quantity: orderQuantity,
      status: orderStatus,
      table: orderTable,
      total_price: orderTotalPrice,
      user_id: userId,
      id: orderId2,
    });
    jest.spyOn(orderRepo, 'create').mockResolvedValue({
      org_id: orgId,
      quantity: orderQuantity,
      status: orderStatus,
      table: orderTable,
      total_price: orderTotalPrice,
      user_id: userId,
      created_at: new Date(),
      deleted_at: null,
      id: orderId1,
      products: [],
    });

    // Act
    const order = await orderService.create(data);

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(wsGateway.emitCreateOrder).toHaveBeenCalledTimes(1);
    expect(wsGateway.emitCreateOrder).toHaveBeenCalledWith({
      event: `order-org-${orgId}`,
      data: {
        action: 'new_order',
        order: order,
      },
    });
    expect(orderRepo.create).toHaveBeenCalledTimes(1);
    expect(orderRepo.create).toHaveBeenCalledWith(data);
  });

  it('Should delete a order', async () => {
    // Arrange
    const order_id = orderId3;
    jest.spyOn(orderRepo, 'delete').mockResolvedValue();

    // Act
    await orderService.deleteOrder(order_id);

    // Assert
    expect(orderRepo.delete).toHaveBeenCalledTimes(1);
    expect(orderRepo.delete).toHaveBeenCalledWith(order_id);
  });

  it('Should cancel a order', async () => {
    // Arrange
    const order_id = orderId3;
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
      order_id: orderId1,
      status: orderStatus,
    });

    // Assert
    expect(orderRepo.updateOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.updateOrder).toHaveBeenCalledWith(orderId1, orderStatus);
  });

  it('Should get a order', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getOrder').mockResolvedValue({
      org_id: orgId,
      quantity: orderQuantity,
      products: [],
      status: orderStatus,
      table: orderTable,
      total_price: orderTotalPrice,
      user_id: userId,
      created_at: new Date(),
      deleted_at: null,
      id: orderId1,
    });

    // Act
    const order = await orderService.getOrder(orderId1);

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(orderRepo.getOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.getOrder).toHaveBeenCalledWith(orderId1);
  });

  it('Should return null if a order does not exists', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getOrder').mockResolvedValue(null);

    // Act
    const order = await orderService.getOrder(orderId2);

    // Assert
    expect(order).toBeNull();
    expect(orderRepo.getOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.getOrder).toHaveBeenCalledWith(orderId2);
  });

  it('Should return all orders of page 0', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getAllOrders').mockResolvedValue(
      Array.from({ length: 26 }).map((_, idx) => ({
        org_id: `${idx}`.repeat(10),
        quantity: orderQuantity,
        status: orderStatus,
        table: `${idx}`.repeat(2),
        total_price: idx * 4.5,
        user_id: `${userId}-${idx}`,
        created_at: new Date(),
        deleted_at: null,
        id: `${idx}`.repeat(5),
        products: [],
      })),
    );

    // Act
    const { orders, has_next } = await orderService.getAllOrders({
      org_id: orgId2,
      page: 0,
    });

    // Assert
    expect(has_next).toBeTruthy();
    expect(orders.length).toBe(25);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orderRepo.getAllOrders).toHaveBeenCalledTimes(1);
    expect(orderRepo.getAllOrders).toHaveBeenCalledWith(orgId2, 0, 26);
  });

  it('Should return all orders of page 1', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getAllOrders').mockResolvedValue(
      Array.from({ length: 3 }).map((_, idx) => ({
        org_id: `${idx}`.repeat(10),
        quantity: orderQuantity,
        status: orderStatus,
        table: `${idx}`.repeat(2),
        total_price: idx * 4.5,
        user_id: `${userId}-${idx}`,
        created_at: new Date(),
        deleted_at: null,
        id: `${idx}`.repeat(5),
        products: [],
      })),
    );

    // Act
    const { orders, has_next } = await orderService.getAllOrders({
      org_id: orgId2,
      page: 1,
    });

    // Assert
    expect(has_next).toBeFalsy();
    expect(orders.length).toBe(3);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orderRepo.getAllOrders).toHaveBeenCalledTimes(1);
    expect(orderRepo.getAllOrders).toHaveBeenCalledWith(orgId2, 25, 26);
  });

  it('Should return all orders of page 0 if the page is not defined', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getAllOrders').mockResolvedValue(
      Array.from({ length: 3 }).map((_, idx) => ({
        org_id: `${idx}`.repeat(10),
        quantity: orderQuantity,
        status: orderStatus,
        table: `${idx}`.repeat(2),
        total_price: idx * 4.5,
        user_id: `${userId}-${idx}`,
        created_at: new Date(),
        deleted_at: null,
        id: `${idx}`.repeat(5),
        products: [],
      })),
    );

    // Act
    const { orders, has_next } = await orderService.getAllOrders({
      org_id: orgId2,
    });

    // Assert
    expect(has_next).toBeFalsy();
    expect(orders.length).toBe(3);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orderRepo.getAllOrders).toHaveBeenCalledTimes(1);
    expect(orderRepo.getAllOrders).toHaveBeenCalledWith(orgId2, 0, 26);
  });

  it('Should return all orders of today', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'getAllOrdersOfToday').mockResolvedValue(
      Array.from({ length: 3 }).map((_, idx) => ({
        org_id: `${idx}`.repeat(10),
        quantity: orderQuantity,
        status: orderStatus,
        table: `${idx}`.repeat(2),
        total_price: idx * 4.5,
        user_id: `${userId}-${idx}`,
        created_at: new Date(),
        deleted_at: null,
        id: `${idx}`.repeat(5),
        products: [],
      })),
    );

    // Act
    const orders = await orderService.getAllOrdersOfToday({
      org_id: orgId2,
      orders_canceled: true,
    });

    // Assert
    expect(orders.length).toBe(3);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orderRepo.getAllOrdersOfToday).toHaveBeenCalledTimes(1);
    expect(orderRepo.getAllOrdersOfToday).toHaveBeenCalledWith({
      orders_canceled: true,
      org_id: orgId2,
    });
  });

  it('Should return true if the order of a user exists', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'verifyOrder').mockResolvedValue({
      org_id: orgId,
      quantity: orderQuantity,
      status: orderStatus,
      table: orderTable,
      total_price: orderTotalPrice,
      user_id: userId,
      created_at: new Date(),
      deleted_at: null,
      id: orderId1,
      products: [],
    });

    // Act
    const isOrderOfOrg = await orderService.verifyOrderByUser({
      order_id: orderId1,
      user_id: userId,
    });

    // Assert
    expect(isOrderOfOrg).toBeTruthy();
    expect(orderRepo.verifyOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.verifyOrder).toHaveBeenCalledWith(orderId1, {
      user_id: userId,
    });
  });

  it('Should return false if the order of a user does not exists', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'verifyOrder').mockResolvedValue(null);

    // Act
    const isOrderOfOrg = await orderService.verifyOrderByUser({
      order_id: orderId1,
      user_id: userId,
    });

    // Assert
    expect(isOrderOfOrg).toBeFalsy();
    expect(orderRepo.verifyOrder).toHaveBeenCalledTimes(1);
    expect(orderRepo.verifyOrder).toHaveBeenCalledWith(orderId1, {
      user_id: userId,
    });
  });

  it('Should restart the orders of the day', async () => {
    // Arrange
    jest.spyOn(orderRepo, 'restartsTheOrdersOfDay').mockResolvedValue();

    // Act
    await orderService.restartsTheOrdersOfDay(orgId);

    // Assert
    expect(orderRepo.restartsTheOrdersOfDay).toHaveBeenCalledTimes(1);
    expect(orderRepo.restartsTheOrdersOfDay).toHaveBeenCalledWith(orgId);
  });
});
