import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Order } from 'src/core/domain/entities/order';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import WsGateway from 'src/modules/ws/ws.gateway';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';
import { OrderService } from '../../order.service';
import { OrderRepository } from '../../repo/order.repository';
import { GetAllOrdersOfTodayUseCase } from '../../usecases/GetAllOrdersOfTodayUseCase';

describe('Get All Orders Of Today UseCase', () => {
  let getAllOrdersOfTodayUseCase: GetAllOrdersOfTodayUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let prismaService: PrismaService;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let wsGateway: WsGateway;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllOrdersOfTodayUseCase,
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
          provide: WsGateway,
          useValue: {
            server: {
              emit: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    getAllOrdersOfTodayUseCase = module.get<GetAllOrdersOfTodayUseCase>(
      GetAllOrdersOfTodayUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<IOrderContract>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    wsGateway = module.get<WsGateway>(WsGateway);

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

    const org2 = await prismaService.organization.create({
      data: {
        name: 'Restaurante Fogo de chão2',
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
      data: Array.from({ length: 10 }).map((_, idx) => ({
        quantity: 1,
        table: `Mesa ${idx}`,
        total_price: 120,
        org_id: org.id,
        user_id: user.id,
        products: [] as Prisma.JsonArray,
        ...(idx % 4 === 0 && { created_at: new Date(2025, 6, idx) }),
        ...(idx % 2 === 0 && { deleted_at: new Date() }),
      })),
    });

    await prismaService.order.createMany({
      data: Array.from({ length: 18 }).map((_, idx) => ({
        quantity: 1,
        table: `Mesa ${idx}`,
        total_price: 120,
        org_id: org2.id,
        user_id: user.id,
        products: [] as Prisma.JsonArray,
        ...(idx % 6 === 0 && { created_at: new Date(2025, 6, idx) }),
        ...(idx % 5 === 0 && { deleted_at: new Date() }),
      })),
    });

    org_id = org.id;
    org_id2 = org2.id;
    user_id = user.id;
  });

  afterAll(async () => {
    await prismaService.order.deleteMany({ where: { org_id: org_id } });
    await prismaService.order.deleteMany({ where: { org_id: org_id2 } });
    await prismaService.organization.delete({ where: { id: org_id } });
    await prismaService.organization.delete({ where: { id: org_id2 } });
    await prismaService.user.delete({ where: { id: user_id } });
  });

  it('Should all services be defined', () => {
    expect(getAllOrdersOfTodayUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(user_id).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(wsGateway).toBeDefined();
  });

  it('Should return all orders of today included the canceled orders', async () => {
    // Act
    const orders = await getAllOrdersOfTodayUseCase.execute(
      user_id,
      UserRole.OWNER,
      org_id,
      {
        canceled_orders: true,
      },
    );
    const orders2 = await getAllOrdersOfTodayUseCase.execute(
      user_id,
      UserRole.OWNER,
      org_id2,
      {
        canceled_orders: true,
      },
    );

    const isDeleted = orders.some((o) => o.deleted_at);
    const isDeleted2 = orders2.some((o) => o.deleted_at);

    // Assert
    expect(isDeleted).toBeTruthy();
    expect(isDeleted2).toBeTruthy();
    expect(orders.length).toBe(7);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orders2.length).toBe(15);
    expect(orders2[0]).toBeInstanceOf(Order);
  });

  it('Should return all orders of today without the canceled orders', async () => {
    // Act
    const orders = await getAllOrdersOfTodayUseCase.execute(
      user_id,
      UserRole.OWNER,
      org_id,
      {
        canceled_orders: false,
      },
    );
    const orders2 = await getAllOrdersOfTodayUseCase.execute(
      user_id,
      UserRole.OWNER,
      org_id2,
      {
        canceled_orders: false,
      },
    );

    const isDeleted = orders.some((o) => o.deleted_at);
    const isDeleted2 = orders2.some((o) => o.deleted_at);

    // Assert
    expect(isDeleted).toBeFalsy();
    expect(isDeleted2).toBeFalsy();
    expect(orders.length).toBe(5);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orders2.length).toBe(12);
    expect(orders2[0]).toBeInstanceOf(Order);
  });

  it('Should throw an error if the org_id not exists', async () => {
    // Assert
    await expect(
      getAllOrdersOfTodayUseCase.execute(user_id, UserRole.OWNER, 'org_id', {
        canceled_orders: false,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the owner_id is not linked with the e org', async () => {
    // Assert
    await expect(
      getAllOrdersOfTodayUseCase.execute('owner_id', UserRole.OWNER, org_id, {
        canceled_orders: false,
      }),
    ).rejects.toThrow(ConflictException);
  });
});
