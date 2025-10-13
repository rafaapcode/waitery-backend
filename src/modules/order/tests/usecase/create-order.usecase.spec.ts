import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Order, OrderStatus } from 'src/core/domain/entities/order';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';
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
  let prismaService: PrismaService;
  let order_id: string;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let cat_id: string;
  let cat_id2: string;
  let products_ids: string[];

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
      ],
    }).compile();

    createOrderUseCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<IOrderContract>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);

    const user = await prismaService.user.create({
      data: {
        cpf: '12345678900',
        name: 'rafael ap',
        email: 'rafaap123@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.OWNER,
      },
    });

    const org = await prismaService.organization.create({
      data: {
        name: 'Restaurante Fogo de chão123312',
        image_url: 'https://example.com/images/clinica.jpg',
        email: 'contato@bemestar.com',
        description:
          'Clínica especializada em atendimento psicológico e terapias.',
        location_code: 'BR-MG-015',
        open_hour: 8,
        close_hour: 18,
        cep: '30130-010',
        city: 'Belo Horizonte',
        neighborhood: 'Funcionários',
        street: 'Rua da Bahia, 1200',
        lat: -19.92083,
        long: -43.937778,
        owner_id: user.id,
      },
    });

    const org2 = await prismaService.organization.create({
      data: {
        name: 'Restaurante Fogo de chão23211234454',
        image_url: 'https://example.com/images/clinica.jpg',
        email: 'contato@bemestar.com',
        description:
          'Clínica especializada em atendimento psicológico e terapias.',
        location_code: 'BR-MG-015',
        open_hour: 8,
        close_hour: 18,
        cep: '30130-010',
        city: 'Belo Horizonte',
        neighborhood: 'Funcionários',
        street: 'Rua da Bahia, 1200',
        lat: -19.92083,
        long: -43.937778,
        owner_id: user.id,
      },
    });

    const cat = await prismaService.category.create({
      data: {
        icon: '🥗',
        name: 'Vegetais',
        org_id: org.id,
      },
    });

    const cat2 = await prismaService.category.create({
      data: {
        icon: '🥗',
        name: 'Vegetais',
        org_id: org2.id,
      },
    });

    const prod1 = await prismaService.product.create({
      data: {
        description: 'Descrição',
        image_url: 'http://',
        name: 'Produto bom 1',
        price: 30,
        ingredients: [
          { name: 'pão', icon: '💪' },
          { name: 'mussarela', icon: '💪' },
        ] as Prisma.JsonArray,
        category_id: cat.id,
        org_id: org.id,
      },
    });

    const prod2 = await prismaService.product.create({
      data: {
        description: 'Descrição',
        image_url: 'http://',
        name: 'Produto bom 2',
        price: 30,
        ingredients: [
          { name: 'pão', icon: '💪' },
          { name: 'mussarela', icon: '💪' },
        ] as Prisma.JsonArray,
        category_id: cat.id,
        org_id: org.id,
      },
    });

    const prod3 = await prismaService.product.create({
      data: {
        description: 'Descrição',
        image_url: 'http://',
        name: 'Produto bom 3',
        price: 30,
        ingredients: [
          { name: 'pão', icon: '💪' },
          { name: 'mussarela', icon: '💪' },
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
    await prismaService.category.delete({ where: { id: cat_id } });
    await prismaService.category.delete({ where: { id: cat_id2 } });
    await prismaService.organization.delete({ where: { id: org_id } });
    await prismaService.organization.delete({ where: { id: org_id2 } });
    await prismaService.user.delete({ where: { id: user_id } });
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
  });

  it('Should create a new order', async () => {
    // Arrange
    const data: CreateOrderDto = {
      org_id,
      user_id,
      table: 'Mesa 15',
      products: [
        {
          price: 30,
          product_id: products_ids[0],
          quantity: 2,
        },
        {
          price: 30,
          product_id: products_ids[1],
          quantity: 2,
        },
      ],
    };
    jest.spyOn(orderService, 'getProductsOfOrder');

    // Act
    const order = await createOrderUseCase.execute(data);

    order_id = order.id!;

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(order.id).toBeDefined();
    expect(order.created_at).toBeDefined();
    expect(order.status).toBe(OrderStatus.WAITING);
    expect(order.quantity).toBe(4);
    expect(order.total_price).toBe(60);
    expect(order.products.length).toBe(2);
    expect(order.products[0].category).toBe(`🥗 Vegetais`);
    expect(orderService.getProductsOfOrder).toHaveBeenCalledTimes(1);
  });

  it('Should throw a BadRequestException if the products is not provided', async () => {
    // Arrange
    const data: CreateOrderDto = {
      org_id,
      user_id,
      table: 'Mesa 15',
      products: [],
    };

    // Assert
    await expect(createOrderUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw a NotFoundException if the org not exist', async () => {
    // Arrange
    const data: CreateOrderDto = {
      org_id: 'org_id',
      user_id,
      table: 'Mesa 15',
      products: [
        {
          price: 30,
          product_id: products_ids[0],
          quantity: 2,
        },
        {
          price: 30,
          product_id: products_ids[1],
          quantity: 2,
        },
      ],
    };

    // Assert
    await expect(createOrderUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });
});
