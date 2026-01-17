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
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Order, OrderStatus } from 'src/core/domain/entities/order';
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
  let order_id: string;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let cat_id: string;
  let cat_id2: string;
  let products_ids: string[];
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
  const productName1 = faker.commerce.productName();
  const productName2 = faker.commerce.productName();
  const productName3 = faker.commerce.productName();
  const productPrice = faker.number.int({
    min: 10,
    max: 100,
  });
  const ingredientIcon = faker.internet.emoji();
  const ingredientName1 = faker.lorem.word().toLowerCase();
  const ingredientName2 = faker.lorem.word().toLowerCase();
  const orderTable = `Mesa ${faker.number.int({ min: 1, max: 50 })}`;
  const productQuantity = faker.number.int({ min: 1, max: 5 });
  const fakeOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    const cat = await prismaService.category.create({
      data: {
        icon: categoryIcon,
        name: categoryName,
        org_id: org.id,
      },
    });

    const cat2 = await prismaService.category.create({
      data: {
        icon: categoryIcon,
        name: categoryName,
        org_id: org2.id,
      },
    });

    const prod1 = await prismaService.product.create({
      data: {
        description: productDescription,
        image_url: productImageUrl,
        name: productName1,
        price: productPrice,
        ingredients: [
          { name: ingredientName1, icon: ingredientIcon },
          { name: ingredientName2, icon: ingredientIcon },
        ] as Prisma.JsonArray,
        category_id: cat.id,
        org_id: org.id,
      },
    });

    const prod2 = await prismaService.product.create({
      data: {
        description: productDescription,
        image_url: productImageUrl,
        name: productName2,
        price: productPrice,
        ingredients: [
          { name: ingredientName1, icon: ingredientIcon },
          { name: ingredientName2, icon: ingredientIcon },
        ] as Prisma.JsonArray,
        category_id: cat.id,
        org_id: org.id,
      },
    });

    const prod3 = await prismaService.product.create({
      data: {
        description: productDescription,
        image_url: productImageUrl,
        name: productName3,
        price: productPrice,
        ingredients: [
          { name: ingredientName1, icon: ingredientIcon },
          { name: ingredientName2, icon: ingredientIcon },
        ] as Prisma.JsonArray,
        category_id: cat2.id,
        org_id: org.id,
      },
    });

    org_id = org.id;
    org_id2 = org2.id;
    user_id = user.id;
    order_id = '';
    cat_id = cat.id;
    cat_id2 = cat2.id;
    products_ids = [prod1.id, prod2.id, prod3.id];
  });

  afterAll(async () => {
    await prismaService.order.delete({ where: { id: order_id } });
    await prismaService.product.deleteMany({
      where: {
        id: {
          in: products_ids,
        },
      },
    });
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

    order_id = order.id!;

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
    expect(order.total_price).toBe(productPrice * productQuantity * 2);
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
