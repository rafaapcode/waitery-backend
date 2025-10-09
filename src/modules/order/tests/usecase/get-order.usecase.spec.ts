import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { Order } from 'src/core/domain/entities/order';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { IORDER_CONTRACT } from 'src/shared/constants';
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
  let cat_id: string;
  let product_id: string;

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
      ],
    }).compile();

    getOrderUseCase = module.get<GetOrderUseCase>(GetOrderUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<OrderService>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);

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
        name: 'Restaurante Fogo de chão da nevasca',
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

    const order = await prismaService.order.create({
      data: {
        quantity: 2,
        table: 'Mesa 10',
        total_price: 60,
        org_id: org.id,
        user_id: user.id,
        products: [
          {
            category: '🥗 Vegetais',
            discount: false,
            name: 'Produto bom 1',
            price: 30,
            quantity: 2,
            image_url: 'http://',
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
    await prismaService.order.deleteMany({ where: { user_id } });
    await prismaService.product.deleteMany({
      where: {
        id: product_id,
      },
    });
    await prismaService.category.deleteMany({ where: { org_id } });
    await prismaService.organization.deleteMany({
      where: { owner_id: user_id },
    });
    await prismaService.user.deleteMany({ where: { cpf: '12345678900' } });
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
  });

  it('Should return the order', async () => {
    // Act
    const order = await getOrderUseCase.execute(order_id, org_id);

    // Assert
    expect(order).toBeInstanceOf(Order);
    expect(order.products.length).toBe(1);
    expect(order.products[0].category).toBe('🥗 Vegetais');
    expect(order.products[0].price).toBe(30);
    expect(order.products[0].image_url).toBeDefined();
  });

  it('Should throw an error if the order does not exists', async () => {
    // Assert
    await expect(getOrderUseCase.execute('order_id', org_id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw an error if the org does not exists', async () => {
    // Assert
    await expect(getOrderUseCase.execute(order_id, 'org_id')).rejects.toThrow(
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
