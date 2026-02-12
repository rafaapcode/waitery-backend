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
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Category, Prisma, Product } from 'generated/prisma';
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
import { GetOrderUseCase } from '../../usecases/GetOrderUseCase';

describe('Get Order UseCase', () => {
  let getOrderUseCase: GetOrderUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let prismaService: PrismaService;
  let order_id: string;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let storageService: IStorageGw;
  let cat_id: string;
  let product_id: string;
  let wsGateway: IOrderWSContract;
  let factoriesService: FactoriesService;
  let prod: Product;
  let cat: Category;

  const fakeOrderId = faker.string.uuid();
  const fakeOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        GetOrderUseCase,
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

    getOrderUseCase = module.get<GetOrderUseCase>(GetOrderUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<IOrderContract>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    wsGateway = module.get<IOrderWSContract>(IORDER_WS_CONTRACT);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const orgGenerated = await factoriesService.generateOrganizationWithOwner();

    const orgGenerated2 = await factoriesService.generateOrganizationWithOwner(
      orgGenerated.owner.id,
    );

    cat = await factoriesService.generateCategoryInfo(
      orgGenerated.organization.id,
    );

    prod = await factoriesService.generateProductInfo(
      orgGenerated.organization.id,
      cat.id,
    );

    const orderGenerated = await factoriesService.generateOrder(
      orgGenerated.organization.id,
      orgGenerated.owner.id,
      [
        {
          category: `${cat.icon} ${cat.name}`,
          discount: false,
          name: prod.name,
          price: prod.price,
          quantity: faker.number.int({ min: 1, max: 5 }),
          image_url: faker.image.url(),
        },
      ] as Prisma.JsonArray,
    );

    org_id = orgGenerated.organization.id;
    user_id = orgGenerated.owner.id;
    order_id = orderGenerated.order.id;
    cat_id = cat.id;
    product_id = prod.id;
    org_id2 = orgGenerated2.organization.id;
  });

  afterAll(async () => {
    await prismaService.order.deleteMany({});
    await prismaService.product.deleteMany({});
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(getOrderUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(user_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(product_id).toBeDefined();
    expect(order_id).toBeDefined();
    expect(wsGateway).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should return the order', async () => {
    // Act
    const order = await getOrderUseCase.execute(order_id, org_id);

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(order.products.length).toBe(1);
    expect(order.products[0].category).toBe(`${cat.icon} ${cat.name}`);
    expect(order.products[0].price).toBe(prod.price);
    expect(order.products[0].image_url).toBeDefined();
  });

  it('Should throw an error if the order does not exists', async () => {
    // Assert
    await expect(getOrderUseCase.execute(fakeOrderId, org_id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw an error if the org does not exists', async () => {
    // Assert
    await expect(getOrderUseCase.execute(order_id, fakeOrgId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw an error if the org is not related with the order', async () => {
    // Assert
    await expect(getOrderUseCase.execute(order_id, org_id2)).rejects.toThrow(
      NotFoundException,
    );
  });
});
