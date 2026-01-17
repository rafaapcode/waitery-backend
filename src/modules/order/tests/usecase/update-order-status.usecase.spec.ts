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
import { OrderStatus } from 'src/core/domain/entities/order';
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

  const userCpf = faker.string.numeric(11);
  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
  const org1Name = faker.company.name();
  const org1ImageUrl = faker.internet.url();
  const org1Email = faker.internet.email();
  const org1Description = faker.lorem.sentence();
  const org1LocationCode = `BR-${faker.location.state({ abbreviated: true })}-${faker.string.numeric(3)}`;
  const org1OpenHour = faker.number.int({ min: 6, max: 10 });
  const org1CloseHour = faker.number.int({ min: 18, max: 22 });
  const org1Cep = faker.string.numeric(8);
  const org1City = faker.location.city();
  const org1Neighborhood = faker.location.street();
  const org1Street = faker.location.streetAddress();
  const org1Lat = faker.location.latitude();
  const org1Long = faker.location.longitude();
  const org2Name = faker.company.name();
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
  const ingredient1Name = faker.lorem.word();
  const ingredient1Icon = faker.internet.emoji();
  const ingredient2Name = faker.lorem.word();
  const ingredient2Icon = faker.internet.emoji();
  const orderQuantity = faker.number.int({ min: 1, max: 5 });
  const orderTable = `Mesa ${faker.number.int({ min: 1, max: 20 })}`;
  const orderTotalPrice = productPrice * orderQuantity;
  const fakeOrderId = faker.string.uuid();
  const fakeOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    const user = await prismaService.user.create({
      data: {
        cpf: userCpf,
        name: userName,
        email: userEmail,
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.OWNER,
      },
    });

    const org = await prismaService.organization.create({
      data: {
        name: org1Name,
        image_url: org1ImageUrl,
        email: org1Email,
        description: org1Description,
        location_code: org1LocationCode,
        open_hour: org1OpenHour,
        close_hour: org1CloseHour,
        cep: org1Cep,
        city: org1City,
        neighborhood: org1Neighborhood,
        street: org1Street,
        lat: org1Lat,
        long: org1Long,
        owner_id: user.id,
      },
    });

    const org2 = await prismaService.organization.create({
      data: {
        name: org2Name,
        image_url: org1ImageUrl,
        email: org1Email,
        description: org1Description,
        location_code: org1LocationCode,
        open_hour: org1OpenHour,
        close_hour: org1CloseHour,
        cep: org1Cep,
        city: org1City,
        neighborhood: org1Neighborhood,
        street: org1Street,
        lat: org1Lat,
        long: org1Long,
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
          { name: ingredient1Name, icon: ingredient1Icon },
          { name: ingredient2Name, icon: ingredient2Icon },
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
    org_id2 = org2.id;
    user_id = user.id;
    order_id = order.id;
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
