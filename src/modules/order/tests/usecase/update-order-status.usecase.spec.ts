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
import { OrderStatus } from 'src/core/domain/entities/order';
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
import { UpdateOrderStatusUseCase } from '../../usecases/UpdateOrderStatusUseCase';

describe('Update Order Status UseCase', () => {
  let updateOrderUseCase: UpdateOrderStatusUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let storageService: IStorageGw;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;
  let order_id: string;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let cat_id: string;
  let product_id: string;
  let wsGateway: IOrderWSContract;
  let factoriesService: FactoriesService;

  const categoryIcon = faker.internet.emoji();
  const categoryName = faker.lorem.word();
  const productImageUrl = faker.internet.url();
  const productName = faker.commerce.productName();
  const productPrice = faker.number.float({
    min: 10,
    max: 100,
    fractionDigits: 2,
  });
  const ingredient1Name = faker.lorem.word();
  const ingredient1Icon = faker.internet.emoji();
  const ingredient2Name = faker.lorem.word();
  const ingredient2Icon = faker.internet.emoji();
  const orderQuantity = faker.number.int({ min: 1, max: 5 });
  const fakeOrderId = faker.string.uuid();
  const fakeOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UpdateOrderStatusUseCase,
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

    updateOrderUseCase = module.get<UpdateOrderStatusUseCase>(
      UpdateOrderStatusUseCase,
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

    const org1 = await factoriesService.generateOrganizationWithOwner();

    const org2 = await factoriesService.generateOrganizationWithOwner(
      org1.owner.id,
    );

    const cat = await factoriesService.generateCategoryInfo(
      org1.organization.id,
    );

    const prod1 = await factoriesService.generateProductInfo(
      org1.organization.id,
      cat.id,
      [
        { name: ingredient1Name, icon: ingredient1Icon },
        { name: ingredient2Name, icon: ingredient2Icon },
      ],
    );

    const order = await factoriesService.generateOrder(
      org1.organization.id,
      org1.owner.id,
      [
        {
          category: `${categoryIcon} ${categoryName}`,
          discount: false,
          name: productName,
          price: productPrice,
          quantity: orderQuantity,
          image_url: productImageUrl,
        },
      ],
    );

    org_id = org1.organization.id;
    org_id2 = org2.organization.id;
    user_id = org1.owner.id;
    order_id = order.order.id;
    cat_id = cat.id;
    product_id = prod1.id;
  });

  afterAll(async () => {
    await prismaService.order.deleteMany({});
    await prismaService.product.deleteMany({});
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(updateOrderUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(user_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(product_id).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(order_id).toBeDefined();
    expect(wsGateway).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should update a status of an order', async () => {
    // Arrange
    const old_order = await prismaService.order.findUnique({
      where: { id: order_id },
    });

    // Act
    await updateOrderUseCase.execute(
      {
        status: OrderStatus.IN_PRODUCTION,
      },
      org_id,
      order_id,
    );
    const new_order = await prismaService.order.findUnique({
      where: { id: order_id },
    });

    expect(old_order?.status).toBe(OrderStatus.WAITING);
    expect(new_order?.status).toBe(OrderStatus.IN_PRODUCTION);
  });

  it('Should throw an error if the order does not exits', async () => {
    // Assert
    await expect(
      updateOrderUseCase.execute(
        {
          status: OrderStatus.IN_PRODUCTION,
        },
        org_id,
        fakeOrderId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the org does not exits', async () => {
    // Assert
    await expect(
      updateOrderUseCase.execute(
        {
          status: OrderStatus.IN_PRODUCTION,
        },
        fakeOrgId,
        order_id,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the org is not related with the order', async () => {
    // Assert
    await expect(
      updateOrderUseCase.execute(
        {
          status: OrderStatus.IN_PRODUCTION,
        },
        org_id2,
        order_id,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the new Status is equal to the current status', async () => {
    // Assert
    await expect(
      updateOrderUseCase.execute(
        {
          status: OrderStatus.IN_PRODUCTION,
        },
        org_id,
        order_id,
      ),
    ).rejects.toThrow(ConflictException);
  });
});
