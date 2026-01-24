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
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Order } from 'src/core/domain/entities/order';
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
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { OrderService } from '../../order.service';
import { OrderRepository } from '../../repo/order.repository';
import { GetAllOrdersOfOrgUseCase } from '../../usecases/GetAllOrdersUseCase';

describe('Get All Orders UseCase', () => {
  let getAllOrdersUseCase: GetAllOrdersOfOrgUseCase;
  let orderService: IOrderContract;
  let storageService: IStorageGw;
  let orderRepo: OrderRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;
  let org_id: string;
  let user_id: string;
  let wsGateway: IOrderWSContract;
  let factoriesService: FactoriesService;

  const fakeOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        GetAllOrdersOfOrgUseCase,
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

    getAllOrdersUseCase = module.get<GetAllOrdersOfOrgUseCase>(
      GetAllOrdersOfOrgUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<IOrderContract>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    wsGateway = module.get<IOrderWSContract>(IORDER_WS_CONTRACT);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const { organization, owner } =
      await factoriesService.generateOrganizationWithOwner();

    await factoriesService.generateManyOrders({
      quantidade: 67,
      orgId: organization.id,
      userId: owner.id,
    });

    org_id = organization.id;
    user_id = owner.id;
  });

  afterAll(async () => {
    await prismaService.order.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(getAllOrdersUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(user_id).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(wsGateway).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should get all orders with 25 orders in the first page if the page parameter is not providede', async () => {
    // Act
    const orders = await getAllOrdersUseCase.execute({
      org_id,
    });

    // Assert
    expect(orders.has_next).toBeTruthy();
    expect(orders.orders.length).toBe(25);
    expect(orders.orders[0]).toBeInstanceOf(Order);
  });

  it('Should get all orders with 25 orders in the first page with the page parameter', async () => {
    // Act
    const orders = await getAllOrdersUseCase.execute({
      org_id,
      page: 0,
    });

    // Assert
    expect(orders.has_next).toBeTruthy();
    expect(orders.orders.length).toBe(25);
    expect(orders.orders[0]).toBeInstanceOf(Order);
  });

  it('Should get all orders with 25 orders in the second page', async () => {
    // Act
    const orders = await getAllOrdersUseCase.execute({
      org_id,
    });
    const orders2 = await getAllOrdersUseCase.execute({
      org_id,
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

  it('Should get all orders with 18 orders in the third page', async () => {
    // Act
    const orders2 = await getAllOrdersUseCase.execute({
      org_id,
      page: 1,
    });
    const orders3 = await getAllOrdersUseCase.execute({
      org_id,
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
    const orders = await getAllOrdersUseCase.execute({
      org_id,
      page: 3,
    });

    // Assert
    expect(orders.has_next).toBeFalsy();
    expect(orders.orders.length).toBe(0);
    expect(orders.orders[0]).toBeUndefined();
  });

  it('Should throw an error if the org does not exists', async () => {
    // Asser
    await expect(
      getAllOrdersUseCase.execute({
        org_id: fakeOrgId,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
