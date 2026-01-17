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
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { Order } from 'src/core/domain/entities/order';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import {
  IORDER_CONTRACT,
  IORDER_WS_CONTRACT,
  ISTORAGE_SERVICE,
} from 'src/shared/constants';
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

  const userCpf = faker.string.numeric(11);
  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
  const userPassword =
    '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u';
  const user2Cpf = faker.string.numeric(11);
  const user2Name = faker.person.fullName();
  const user2Email = faker.internet.email();
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
  const orderQuantity1 = faker.number.int({ min: 1, max: 10 });
  const orderQuantity2 = faker.number.int({ min: 1, max: 10 });
  const orderTotalPrice1 = faker.number.float({
    min: 50,
    max: 1000,
    fractionDigits: 2,
  });
  const orderTotalPrice2 = faker.number.float({
    min: 50,
    max: 1000,
    fractionDigits: 2,
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    const user = await prismaService.user.create({
      data: {
        cpf: userCpf,
        name: userName,
        email: userEmail,
        password: userPassword,
        role: UserRole.OWNER,
      },
    });

    const user2 = await prismaService.user.create({
      data: {
        cpf: user2Cpf,
        name: user2Name,
        email: user2Email,
        password: userPassword,
        role: UserRole.ADMIN,
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
        owner_id: user2.id,
      },
    });

    await prismaService.order.createMany({
      data: Array.from({ length: 67 }).map((_, idx) => ({
        quantity: orderQuantity1,
        table: `Mesa ${idx}`,
        total_price: orderTotalPrice1,
        org_id: org.id,
        user_id: user.id,
        products: [] as Prisma.JsonArray,
      })),
    });

    await prismaService.order.createMany({
      data: Array.from({ length: 5 }).map((_, idx) => ({
        quantity: orderQuantity2,
        table: `Mesa ${idx}`,
        total_price: orderTotalPrice2,
        org_id: org2.id,
        user_id: user.id,
        products: [] as Prisma.JsonArray,
      })),
    });

    org_id = org.id;
    user_id = user.id;
    user_id2 = user2.id;
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

  it('Should get all orders with 22 orders in the third page', async () => {
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
    expect(orders3.orders.length).toBe(22);
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
