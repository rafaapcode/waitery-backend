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
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Order } from 'src/core/domain/entities/order';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  IORDER_CONTRACT,
  IORDER_WS_CONTRACT,
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { OrderService } from '../../order.service';
import { OrderRepository } from '../../repo/order.repository';
import { GetAllOrdersOfTodayUseCase } from '../../usecases/GetAllOrdersOfTodayUseCase';

describe('Get All Orders Of Today UseCase', () => {
  let getAllOrdersOfTodayUseCase: GetAllOrdersOfTodayUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let storageService: IStorageGw;
  let org_id: string;
  let org_id2: string;
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
  const orderTotalPrice = faker.number.float({
    min: 50,
    max: 1000,
    fractionDigits: 2,
  });
  const fakeOrgId = faker.string.uuid();
  const fakeOwnerId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllOrdersOfTodayUseCase,
        PrismaService,
        OrderRepository,
        OrganizationRepo,
        {
          provide: IORDER_CONTRACT,
          useClass: OrderService,
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
        {
          provide: IORDER_WS_CONTRACT,
          useValue: {
            emitCreateOrder: jest.fn(),
          },
        },
        {
          provide: IUTILS_SERVICE,
          useValue: {
            verifyCepService: jest.fn(),
            validateHash: jest.fn(),
            generateHash: jest.fn(),
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

    getAllOrdersOfTodayUseCase = module.get<GetAllOrdersOfTodayUseCase>(
      GetAllOrdersOfTodayUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<IOrderContract>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    wsGateway = module.get<IOrderWSContract>(IORDER_WS_CONTRACT);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
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

    await prismaService.order.createMany({
      data: Array.from({ length: 10 }).map((_, idx) => ({
        quantity: orderQuantity,
        table: `Mesa ${idx}`,
        total_price: orderTotalPrice,
        org_id: org.id,
        user_id: user.id,
        products: [] as Prisma.JsonArray,
        ...(idx % 4 === 0 && { created_at: new Date(2025, 6, idx) }),
        ...(idx % 2 === 0 && { deleted_at: new Date() }),
      })),
    });

    await prismaService.order.createMany({
      data: Array.from({ length: 18 }).map((_, idx) => ({
        quantity: orderQuantity,
        table: `Mesa ${idx}`,
        total_price: orderTotalPrice,
        org_id: org2.id,
        user_id: user.id,
        products: [] as Prisma.JsonArray,
        ...(idx % 6 === 0 && { created_at: new Date(2025, 6, idx) }),
        ...(idx % 5 === 0 && { deleted_at: new Date() }),
      })),
    });

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
    expect(getAllOrdersOfTodayUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(user_id).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(wsGateway).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should return all orders of today included the canceled orders', async () => {
    // Act
    const orders = await getAllOrdersOfTodayUseCase.execute(
      user_id,
      UserRole.OWNER,
      org_id,
      {
        canceled_orders: true,
      },
    );
    const orders2 = await getAllOrdersOfTodayUseCase.execute(
      user_id,
      UserRole.OWNER,
      org_id2,
      {
        canceled_orders: true,
      },
    );

    const isDeleted = orders.some((o) => o.deleted_at);
    const isDeleted2 = orders2.some((o) => o.deleted_at);

    // Assert
    expect(isDeleted).toBeTruthy();
    expect(isDeleted2).toBeTruthy();
    expect(orders.length).toBe(7);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orders2.length).toBe(15);
    expect(orders2[0]).toBeInstanceOf(Order);
  });

  it('Should return all orders of today without the canceled orders', async () => {
    // Act
    const orders = await getAllOrdersOfTodayUseCase.execute(
      user_id,
      UserRole.OWNER,
      org_id,
      {
        canceled_orders: false,
      },
    );
    const orders2 = await getAllOrdersOfTodayUseCase.execute(
      user_id,
      UserRole.OWNER,
      org_id2,
      {
        canceled_orders: false,
      },
    );

    const isDeleted = orders.some((o) => o.deleted_at);
    const isDeleted2 = orders2.some((o) => o.deleted_at);

    // Assert
    expect(isDeleted).toBeFalsy();
    expect(isDeleted2).toBeFalsy();
    expect(orders.length).toBe(5);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orders2.length).toBe(12);
    expect(orders2[0]).toBeInstanceOf(Order);
  });

  it('Should throw an error if the org_id not exists', async () => {
    // Assert
    await expect(
      getAllOrdersOfTodayUseCase.execute(user_id, UserRole.OWNER, fakeOrgId, {
        canceled_orders: false,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the owner_id is not linked with the e org', async () => {
    // Assert
    await expect(
      getAllOrdersOfTodayUseCase.execute(fakeOwnerId, UserRole.OWNER, org_id, {
        canceled_orders: false,
      }),
    ).rejects.toThrow(ConflictException);
  });
});
