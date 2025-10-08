import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { Order } from 'src/core/domain/entities/order';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { IORDER_CONTRACT } from 'src/shared/constants';
import { OrderService } from '../../order.service';
import { OrderRepository } from '../../repo/order.repository';
import { GetOrdersOfUserUseCase } from '../../usecases/GetOrdersOfUserUseCase';

describe('Get Orders of a User UseCase', () => {
  let getOrdersOfUserUseCase: GetOrdersOfUserUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let prismaService: PrismaService;
  let org_id: string;
  let user_id: string;
  let user_id2: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrdersOfUserUseCase,
        PrismaService,
        OrderRepository,
        {
          provide: IORDER_CONTRACT,
          useClass: OrderService,
        },
      ],
    }).compile();

    getOrdersOfUserUseCase = module.get<GetOrdersOfUserUseCase>(
      GetOrdersOfUserUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<OrderService>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);

    const user = await prismaService.user.create({
      data: {
        cpf: '22222222222',
        name: 'rafael ap',
        email: 'rafaap@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.OWNER,
      },
    });

    const user2 = await prismaService.user.create({
      data: {
        cpf: '12223245829',
        name: 'rafael ap',
        email: 'rafaap321321321@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.ADMIN,
      },
    });

    const org = await prismaService.organization.create({
      data: {
        name: 'Restaurante Fogo de chão',
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

    await prismaService.order.createMany({
      data: Array.from({ length: 67 }).map((_, idx) => ({
        quantity: 1,
        table: `Mesa ${idx}`,
        total_price: 120,
        org_id: org.id,
        user_id: user.id,
        products: [] as Prisma.JsonArray,
      })),
    });

    org_id = org.id;
    user_id = user.id;
    user_id2 = user2.id;
  });

  afterAll(async () => {
    await prismaService.order.deleteMany({ where: { org_id: org_id } });
    await prismaService.organization.deleteMany({
      where: { owner_id: user_id },
    });
    await prismaService.user.deleteMany({ where: { name: 'rafael ap' } });
  });

  it('Should all services be defined', () => {
    expect(getOrdersOfUserUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(user_id).toBeDefined();
    expect(user_id2).toBeDefined();
  });

  it('Should get all orders with 25 orders in the first page if the page parameter is not providede', async () => {
    // Act
    const orders = await getOrdersOfUserUseCase.execute({
      user_id,
    });

    // Assert
    expect(orders.has_next).toBeTruthy();
    expect(orders.orders.length).toBe(25);
    expect(orders.orders[0]).toBeInstanceOf(Order);
  });

  it('Should get all orders with 25 orders in the first page with the page parameter', async () => {
    // Act
    const orders = await getOrdersOfUserUseCase.execute({
      user_id,
      page: 0,
    });

    // Assert
    expect(orders.has_next).toBeTruthy();
    expect(orders.orders.length).toBe(25);
    expect(orders.orders[0]).toBeInstanceOf(Order);
  });

  it('Should get all orders with 25 orders in the second page', async () => {
    // Act
    const orders = await getOrdersOfUserUseCase.execute({
      user_id,
    });
    const orders2 = await getOrdersOfUserUseCase.execute({
      user_id,
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
    const orders2 = await getOrdersOfUserUseCase.execute({
      user_id,
      page: 1,
    });
    const orders3 = await getOrdersOfUserUseCase.execute({
      user_id,
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
    const orders = await getOrdersOfUserUseCase.execute({
      user_id,
      page: 3,
    });

    // Assert
    expect(orders.has_next).toBeFalsy();
    expect(orders.orders.length).toBe(0);
    expect(orders.orders[0]).toBeUndefined();
  });
});
