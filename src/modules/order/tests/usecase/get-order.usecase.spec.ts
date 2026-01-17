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
  const categoryIcon = faker.internet.emoji();
  const categoryName = faker.lorem.word();
  const productDescription = faker.lorem.sentence();
  const productImageUrl = faker.internet.url();
  const productName = faker.commerce.productName();
  const productPrice = faker.number.float({
    min: 10,
    max: 100,
    fractionDigits: 2,
  });
  const ingredientIcon = faker.internet.emoji();
  const ingredientName1 = faker.lorem.word().toLowerCase();
  const ingredientName2 = faker.lorem.word().toLowerCase();
  const orderQuantity = faker.number.int({ min: 1, max: 5 });
  const orderTable = `Mesa ${faker.number.int({ min: 1, max: 50 })}`;
  const orderTotalPrice = productPrice * orderQuantity;
  const fakeOrderId = faker.string.uuid();
  const fakeOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    const cat = await prismaService.category.create({
      data: {
        icon: categoryIcon,
        name: categoryName,
        org_id: org.id,
      },
    });

    const prod1 = await prismaService.product.create({
      data: {
        description: productDescription,
        image_url: productImageUrl,
        name: productName,
        price: productPrice,
        ingredients: [
          { name: ingredientName1, icon: ingredientIcon },
          { name: ingredientName2, icon: ingredientIcon },
        ] as Prisma.JsonArray,
        category_id: cat.id,
        org_id: org.id,
      },
    });

    const order = await prismaService.order.create({
      data: {
        quantity: orderQuantity,
        table: orderTable,
        total_price: orderTotalPrice,
        org_id: org.id,
        user_id: user.id,
        products: [
          {
            category: `${categoryIcon} ${categoryName}`,
            discount: false,
            name: productName,
            price: productPrice,
            quantity: orderQuantity,
            image_url: productImageUrl,
          },
        ],
      },
    });

    org_id = org.id;
    user_id = user.id;
    order_id = order.id;
    cat_id = cat.id;
    product_id = prod1.id;
    org_id2 = org2.id;
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
    expect(order.products[0].category).toBe(`${categoryIcon} ${categoryName}`);
    expect(order.products[0].price).toBe(productPrice);
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
