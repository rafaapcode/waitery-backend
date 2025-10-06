import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';
import { OrderService } from '../../order.service';
import { OrderRepository } from '../../repo/order.repository';
import { DeleteOrderUseCase } from '../../usecases/DeleteOrderUseCase';

describe('Delete Order UseCase', () => {
  let deleteOrderUseCase: DeleteOrderUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let prismaService: PrismaService;
  let order_id: string;
  let org_id: string;
  let org_id2: string;
  let user_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteOrderUseCase,
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

    deleteOrderUseCase = module.get<DeleteOrderUseCase>(DeleteOrderUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<OrderService>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    orgService = module.get<OrganizationService>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);

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
    org_id2 = org2.id;
    user_id = user.id;
  });

  afterAll(async () => {
    // await prismaService.order.delete({ where: { id: order_id } });
    await prismaService.organization.delete({ where: { id: org_id } });
    await prismaService.organization.delete({ where: { id: org_id2 } });
    await prismaService.user.delete({ where: { id: user_id } });
  });

  it('Should all services be defined', () => {
    expect(deleteOrderUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(order_id).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(user_id).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
  });

  it('Should delete a order', async () => {
    // Arrange
    jest.spyOn(orderService, 'deleteOrder');

    // Assert
    await deleteOrderUseCase.execute(order_id, org_id);

    expect(orderService.deleteOrder).toHaveBeenCalledTimes(1);
    expect(orderService.deleteOrder).toHaveBeenCalledWith(order_id);
  });

  it('Should throw an error if the org does not exist', async () => {
    // Assert
    await expect(
      deleteOrderUseCase.execute(order_id, 'org_id'),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the order is not related with a org', async () => {
    // Assert
    await expect(deleteOrderUseCase.execute(order_id, org_id2)).rejects.toThrow(
      ConflictException,
    );
  });
});
