import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { OrderStatus } from 'src/core/domain/entities/order';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  IORDER_CONTRACT,
  IORDER_WS_CONTRACT,
  IORGANIZATION_CONTRACT,
} from 'src/shared/constants';
import { OrderService } from '../../order.service';
import { OrderRepository } from '../../repo/order.repository';
import { RestartOrdersOfDayUseCase } from '../../usecases/RestartOrdersOfDay';

describe('Restart Order UseCase', () => {
  let restartOrdersOfDayUsecase: RestartOrdersOfDayUseCase;
  let orderService: IOrderContract;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let orderRepo: OrderRepository;
  let prismaService: PrismaService;
  let order_id: string;
  let org_id: string;
  let user_id: string;
  let wsGateway: IOrderWSContract;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestartOrdersOfDayUseCase,
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
      ],
    }).compile();

    restartOrdersOfDayUsecase = module.get<RestartOrdersOfDayUseCase>(
      RestartOrdersOfDayUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<IOrderContract>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    wsGateway = module.get<IOrderWSContract>(IORDER_WS_CONTRACT);

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

    const { id } = await prismaService.order.create({
      data: {
        quantity: 1,
        table: 'Mesa 10',
        total_price: 120,
        org_id: org.id,
        user_id: user.id,
        products: [] as Prisma.JsonArray,
      },
    });

    order_id = id;
    org_id = org.id;
    user_id = user.id;
  });

  afterAll(async () => {
    await prismaService.order.delete({ where: { id: order_id } });
    await prismaService.organization.delete({ where: { id: org_id } });
    await prismaService.user.delete({ where: { id: user_id } });
  });

  it('Should all services be defined', () => {
    expect(restartOrdersOfDayUsecase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(order_id).toBeDefined();
    expect(org_id).toBeDefined();
    expect(user_id).toBeDefined();
    expect(wsGateway).toBeDefined();
  });

  it('Should restart the day', async () => {
    // Arrange
    const orders_before_restart = await prismaService.order.findUnique({
      where: { id: order_id },
    });

    // Act
    await restartOrdersOfDayUsecase.execute(org_id);
    const order_after_restart = await prismaService.order.findUnique({
      where: { id: order_id },
    });

    // Assert
    expect(orders_before_restart?.status).toBe(OrderStatus.WAITING);
    expect(orders_before_restart?.deleted_at).toBeNull();
    expect(order_after_restart?.status).toBe(OrderStatus.CANCELED);
    expect(order_after_restart?.deleted_at).toBeTruthy();
  });

  it('Should not restart the day', async () => {
    // Assert
    await expect(restartOrdersOfDayUsecase.execute('org_id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
