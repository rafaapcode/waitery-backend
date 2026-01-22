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

import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { OrderStatus } from 'src/core/domain/entities/order';
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
import { CancelOrderUseCase } from '../../usecases/CancelOrderUseCase';

describe('Cancel Order UseCase', () => {
  let cancelOrderUsecase: CancelOrderUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let prismaService: PrismaService;
  let order_id: string;
  let org_id: string;
  let org_id2: string;
  let storageService: IStorageGw;
  let user_id: string;
  let wsGateway: IOrderWSContract;
  let factoriesService: FactoriesService;

  const fakeOrgId = faker.string.uuid();
  const fakeOrderId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        CancelOrderUseCase,
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

    cancelOrderUsecase = module.get<CancelOrderUseCase>(CancelOrderUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<IOrderContract>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    wsGateway = module.get<IOrderWSContract>(IORDER_WS_CONTRACT);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const orderGenerated = await factoriesService.generateOrder();
    const org2 = await factoriesService.generateOrganizationWithOwner(
      orderGenerated.user_id,
    );

    order_id = orderGenerated.order.id;
    org_id = orderGenerated.org_id;
    org_id2 = org2.organization.id;
    user_id = orderGenerated.user_id;
  });

  afterAll(async () => {
    await prismaService.order.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(cancelOrderUsecase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(order_id).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(user_id).toBeDefined();
    expect(wsGateway).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should cancel an order', async () => {
    // Arrange
    const order_before_cancel = await prismaService.order.findUnique({
      where: { id: order_id },
    });

    // Act
    await cancelOrderUsecase.execute(order_id, org_id);
    const order_after_cancel = await prismaService.order.findUnique({
      where: { id: order_id },
    });
    // Assert
    expect(order_before_cancel?.status).toBe(OrderStatus.WAITING);
    expect(order_before_cancel?.deleted_at).toBeNull();
    expect(order_after_cancel?.status).toBe(OrderStatus.CANCELED);
    expect(order_after_cancel?.deleted_at).toBeTruthy();
  });
  it('Should throw an NotFoundException if the order is not related with the ORG', async () => {
    await expect(cancelOrderUsecase.execute(order_id, org_id2)).rejects.toThrow(
      NotFoundException,
    );
  });
  it('Should throw an NotFoundException if the Org does not exists', async () => {
    await expect(
      cancelOrderUsecase.execute(order_id, fakeOrgId),
    ).rejects.toThrow(NotFoundException);
  });
  it('Should throw an NotFoundException if the order does not exists', async () => {
    await expect(
      cancelOrderUsecase.execute(fakeOrderId, org_id),
    ).rejects.toThrow(NotFoundException);
  });
});
