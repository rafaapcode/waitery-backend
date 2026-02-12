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
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Category, Product } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Order, OrderStatus } from 'src/core/domain/entities/order';
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
import { CreateOrderDto } from '../../dto/create-order.dto';
import { OrderService } from '../../order.service';
import { OrderRepository } from '../../repo/order.repository';
import { CreateOrderUseCase } from '../../usecases/CreateOrderUseCase';

describe('Create Order UseCase', () => {
  let createOrderUseCase: CreateOrderUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let storageService: IStorageGw;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let cat_id: string;
  let cat_id2: string;
  let products_ids: string[];
  let wsGateway: IOrderWSContract;
  let factoriesService: FactoriesService;
  let prod1: Product;
  let prod2: Product;
  let cat: Category;

  const orderTable = `Mesa ${faker.number.int({ min: 1, max: 50 })}`;
  const productQuantity = faker.number.int({ min: 1, max: 5 });
  const fakeOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        CreateOrderUseCase,
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

    createOrderUseCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<IOrderContract>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    wsGateway = module.get<IOrderWSContract>(IORDER_WS_CONTRACT);
    factoriesService = module.get<FactoriesService>(FactoriesService);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);

    const orgGenerated = await factoriesService.generateOrganizationWithOwner();

    const orgGenerated2 = await factoriesService.generateOrganizationWithOwner(
      orgGenerated.owner.id,
    );

    cat = await factoriesService.generateCategoryInfo(
      orgGenerated.organization.id,
    );

    const cat2 = await factoriesService.generateCategoryInfo(
      orgGenerated2.organization.id,
    );

    prod1 = await factoriesService.generateProductInfo(
      orgGenerated.organization.id,
      cat.id,
    );

    prod2 = await factoriesService.generateProductInfo(
      orgGenerated.organization.id,
      cat.id,
    );

    const prod3 = await factoriesService.generateProductInfo(
      orgGenerated.organization.id,
      cat2.id,
    );

    org_id = orgGenerated.organization.id;
    org_id2 = orgGenerated2.organization.id;
    user_id = orgGenerated.owner.id;
    cat_id = cat.id;
    cat_id2 = cat2.id;
    products_ids = [prod1.id, prod2.id, prod3.id];
  });

  afterAll(async () => {
    await prismaService.order.deleteMany({});
    await prismaService.product.deleteMany({});
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(createOrderUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(user_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(cat_id2).toBeDefined();
    expect(products_ids).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(wsGateway).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should create a new order', async () => {
    // Arrange
    const data: CreateOrderDto = {
      org_id,
      user_id,
      table: orderTable,
      products: [
        {
          product_id: products_ids[0],
          quantity: productQuantity,
        },
        {
          product_id: products_ids[1],
          quantity: productQuantity,
        },
      ],
    };
    jest.spyOn(orderService, 'getProductsOfOrder');

    // Act
    const order = await createOrderUseCase.execute(data);
    const productPrice =
      prod1.price * productQuantity + prod2.price * productQuantity;
    const categoryName = cat.name;
    const categoryIcon = cat.icon;

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(wsGateway.emitCreateOrder).toHaveBeenCalledTimes(1);
    expect(wsGateway.emitCreateOrder).toHaveBeenCalledWith({
      event: `order-org-${org_id}`,
      data: {
        action: 'new_order',
        order: order,
      },
    });
    expect(order.id).toBeDefined();
    expect(order.created_at).toBeDefined();
    expect(order.status).toBe(OrderStatus.WAITING);
    expect(order.quantity).toBe(productQuantity * 2);
    expect(order.total_price).toBe(productPrice);
    expect(order.products.length).toBe(2);
    expect(order.products[0].category).toBe(`${categoryIcon} ${categoryName}`);
    expect(orderService.getProductsOfOrder).toHaveBeenCalledTimes(1);
  });

  it('Should throw a BadRequestException if the products is not provided', async () => {
    // Arrange
    const data: CreateOrderDto = {
      org_id,
      user_id,
      table: orderTable,
      products: [],
    };

    // Assert
    await expect(createOrderUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw a NotFoundException if the org not exists', async () => {
    // Arrange
    const data: CreateOrderDto = {
      org_id: fakeOrgId,
      user_id,
      table: orderTable,
      products: [
        {
          product_id: products_ids[0],
          quantity: productQuantity,
        },
        {
          product_id: products_ids[1],
          quantity: productQuantity,
        },
      ],
    };

    // Assert
    await expect(createOrderUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw a BadRequestException if the products is not found for the order', async () => {
    // Arrange
    const data: CreateOrderDto = {
      org_id: org_id2,
      user_id,
      table: orderTable,
      products: [
        {
          product_id: products_ids[0],
          quantity: productQuantity,
        },
        {
          product_id: products_ids[1],
          quantity: productQuantity,
        },
      ],
    };

    // Assert
    await expect(createOrderUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });
});
