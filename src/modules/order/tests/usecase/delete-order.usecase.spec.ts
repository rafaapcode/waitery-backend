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
    GOOGLE_MAPS_API_KEY: 'https://nominatim_teste.openstreetmap.org/search',
  },
}));

import { faker } from '@faker-js/faker';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
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
import { DeleteOrderUseCase } from '../../usecases/DeleteOrderUseCase';

describe('Delete Order UseCase', () => {
  let deleteOrderUseCase: DeleteOrderUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;
  let storageService: IStorageGw;
  let order_id: string;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let wsGateway: IOrderWSContract;
  let factoriesService: FactoriesService;

  const fakeOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        DeleteOrderUseCase,
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

    deleteOrderUseCase = module.get<DeleteOrderUseCase>(DeleteOrderUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<IOrderContract>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    wsGateway = module.get<IOrderWSContract>(IORDER_WS_CONTRACT);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const orgGenerated = await factoriesService.generateOrganizationWithOwner();

    const orgGenerated2 = await factoriesService.generateOrganizationWithOwner(
      orgGenerated.owner.id,
    );

    const orderGenerated = await factoriesService.generateOrder(
      orgGenerated.organization.id,
      orgGenerated.owner.id,
    );

    order_id = orderGenerated.order.id;
    org_id = orgGenerated.organization.id;
    org_id2 = orgGenerated2.organization.id;
    user_id = orgGenerated.owner.id;
  });

  afterAll(async () => {
    await prismaService.order.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(deleteOrderUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(order_id).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(user_id).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(wsGateway).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should throw an error if the org does not exist', async () => {
    // Assert
    await expect(
      deleteOrderUseCase.execute(order_id, fakeOrgId),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the order is not related with a org', async () => {
    // Assert
    await expect(deleteOrderUseCase.execute(order_id, org_id2)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should delete a order', async () => {
    // Arrange
    jest.spyOn(orderService, 'deleteOrder');

    // Assert
    await deleteOrderUseCase.execute(order_id, org_id);

    expect(orderService.deleteOrder).toHaveBeenCalledTimes(1);
    expect(orderService.deleteOrder).toHaveBeenCalledWith(order_id);
  });
});
