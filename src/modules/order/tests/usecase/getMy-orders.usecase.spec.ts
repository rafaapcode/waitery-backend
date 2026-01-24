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
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { Order } from 'src/core/domain/entities/order';
import { PrismaService } from 'src/infra/database/database.service';
import {
  IORDER_CONTRACT,
  IORDER_WS_CONTRACT,
  ISTORAGE_SERVICE,
} from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { OrderService } from '../../order.service';
import { OrderRepository } from '../../repo/order.repository';
import { GetMyOrderUseCase } from '../../usecases/GetMyOrdersUseCase';

describe('Get My Orders UseCase', () => {
  let getMyOrdersUseCase: GetMyOrderUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let prismaService: PrismaService;
  let storageService: IStorageGw;
  let org_id: string;
  let user_id: string;
  let user_id2: string;
  let wsGateway: IOrderWSContract;
  let factoriesService: FactoriesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        GetMyOrderUseCase,
        PrismaService,
        OrderRepository,
        {
          provide: IORDER_CONTRACT,
          useClass: OrderService,
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

    getMyOrdersUseCase = module.get<GetMyOrderUseCase>(GetMyOrderUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<IOrderContract>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    wsGateway = module.get<IOrderWSContract>(IORDER_WS_CONTRACT);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const org1 = await factoriesService.generateOrganizationWithOwner();
    const org2 = await factoriesService.generateOrganizationWithOwner();

    await factoriesService.generateManyOrders({
      quantidade: 67,
      orgId: org1.organization.id,
      userId: org1.owner.id,
    });

    await factoriesService.generateManyOrders({
      quantidade: 5,
      orgId: org2.organization.id,
      userId: org2.owner.id,
    });

    org_id = org1.organization.id;
    user_id = org1.owner.id;
    user_id2 = org2.owner.id;
  });

  afterAll(async () => {
    await prismaService.order.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(getMyOrdersUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(user_id).toBeDefined();
    expect(user_id2).toBeDefined();
    expect(wsGateway).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should get all orders with 25 orders in the first page if the page parameter is not providede', async () => {
    // Act
    const orders = await getMyOrdersUseCase.execute({
      user_id,
    });

    // Assert
    expect(orders.has_next).toBeTruthy();
    expect(orders.orders.length).toBe(25);
    expect(orders.orders[0]).toBeInstanceOf(Order);
  });

  it('Should get all orders with 25 orders in the first page with the page parameter', async () => {
    // Act
    const orders = await getMyOrdersUseCase.execute({
      user_id,
      page: 0,
    });

    // Assert
    expect(orders.has_next).toBeTruthy();
    expect(orders.orders.length).toBe(25);
    expect(orders.orders[0]).toBeInstanceOf(Order);
  });

  it('Should get all orders with 25 orders in the second page', async () => {
    // Act
    const orders = await getMyOrdersUseCase.execute({
      user_id,
    });
    const orders2 = await getMyOrdersUseCase.execute({
      user_id,
      page: 1,
    });

    // Assert
    expect(orders2.has_next).toBeTruthy();
    expect(orders2.orders.length).toBe(25);
    expect(orders2.orders[0]).toBeInstanceOf(Order);
    expect(orders.orders[0].id).not.toBe(orders2.orders[0].id);
    expect(orders.orders[1].id).not.toBe(orders2.orders[1].id);
    expect(orders.orders[2].id).not.toBe(orders2.orders[2].id);
    expect(orders.orders[3].id).not.toBe(orders2.orders[3].id);
  });

  it('Should get all orders with 17 orders in the third page', async () => {
    // Act
    const orders2 = await getMyOrdersUseCase.execute({
      user_id,
      page: 1,
    });
    const orders3 = await getMyOrdersUseCase.execute({
      user_id,
      page: 2,
    });

    // Assert
    expect(orders3.has_next).toBeFalsy();
    expect(orders3.orders.length).toBe(17);
    expect(orders3.orders[0]).toBeInstanceOf(Order);
    expect(orders2.orders[0].id).not.toBe(orders3.orders[0].id);
    expect(orders2.orders[1].id).not.toBe(orders3.orders[1].id);
    expect(orders2.orders[2].id).not.toBe(orders3.orders[2].id);
    expect(orders2.orders[3].id).not.toBe(orders3.orders[3].id);
  });

  it('Should return 0 orders in the Fourth page', async () => {
    // Act
    const orders = await getMyOrdersUseCase.execute({
      user_id,
      page: 3,
    });

    // Assert
    expect(orders.has_next).toBeFalsy();
    expect(orders.orders.length).toBe(0);
    expect(orders.orders[0]).toBeUndefined();
  });
});
