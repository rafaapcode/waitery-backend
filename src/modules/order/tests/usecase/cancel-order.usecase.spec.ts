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
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { OrderStatus } from 'src/core/domain/entities/order';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import {
  IORDER_CONTRACT,
  IORDER_WS_CONTRACT,
  ISTORAGE_SERVICE,
} from 'src/shared/constants';
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

  const userCpf = faker.string.numeric(11);
  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
  const userPassword =
    '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u';
  const orgName = faker.company.name();
  const orgName2 = faker.company.name();
  const orgImageUrl = faker.internet.url();
  const orgEmail = faker.internet.email();
  const orgDescription = faker.lorem.sentence();
  const orgLocationCode = `BR-${faker.location.state({ abbreviated: true })}-${faker.string.numeric(3)}`;
  const orgOpenHour = faker.number.int({ min: 6, max: 10 });
  const orgCloseHour = faker.number.int({ min: 18, max: 23 });
  const orgCep = faker.location.zipCode('#####-###');
  const orgCity = faker.location.city();
  const orgNeighborhood = faker.location.county();
  const orgStreet = faker.location.streetAddress();
  const orgLat = faker.location.latitude();
  const orgLong = faker.location.longitude();
  const orderQuantity = faker.number.int({ min: 1, max: 10 });
  const orderTable = `Mesa ${faker.number.int({ min: 1, max: 50 })}`;
  const orderTotalPrice = faker.number.float({
    min: 50,
    max: 1000,
    fractionDigits: 2,
  });
  const fakeOrgId = faker.string.uuid();
  const fakeOrderId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    const user = await prismaService.user.create({
      data: {
        cpf: userCpf,
        name: userName,
        email: userEmail,
        password: userPassword,
        role: UserRole.OWNER,
      },
    });

    const org = await prismaService.organization.create({
      data: {
        name: orgName,
        image_url: orgImageUrl,
        email: orgEmail,
        description: orgDescription,
        location_code: orgLocationCode,
        open_hour: orgOpenHour,
        close_hour: orgCloseHour,
        cep: orgCep,
        city: orgCity,
        neighborhood: orgNeighborhood,
        street: orgStreet,
        lat: orgLat,
        long: orgLong,
        owner_id: user.id,
      },
    });

    const org2 = await prismaService.organization.create({
      data: {
        name: orgName2,
        image_url: orgImageUrl,
        email: orgEmail,
        description: orgDescription,
        location_code: orgLocationCode,
        open_hour: orgOpenHour,
        close_hour: orgCloseHour,
        cep: orgCep,
        city: orgCity,
        neighborhood: orgNeighborhood,
        street: orgStreet,
        lat: orgLat,
        long: orgLong,
        owner_id: user.id,
      },
    });

    const { id } = await prismaService.order.create({
      data: {
        quantity: orderQuantity,
        table: orderTable,
        total_price: orderTotalPrice,
        org_id: org.id,
        user_id: user.id,
        products: [] as Prisma.JsonArray,
      },
    });

    order_id = id;
    org_id = org.id;
    org_id2 = org2.id;
    user_id = user.id;
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
