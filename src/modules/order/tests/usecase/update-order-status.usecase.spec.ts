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
import { UpdateOrderStatusUseCase } from '../../usecases/UpdateOrderStatusUseCase';

describe('Update Order Status UseCase', () => {
  let updateOrderUseCase: UpdateOrderStatusUseCase;
  let orderService: IOrderContract;
  let orderRepo: OrderRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let prismaService: PrismaService;
  let order_id: string;
  let org_id: string;
  let user_id: string;
  let cat_id: string;
  let product_id: string;

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
      ],
    }).compile();

    updateOrderUseCase = module.get<UpdateOrderStatusUseCase>(
      UpdateOrderStatusUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    orderService = module.get<OrderService>(IORDER_CONTRACT);
    orderRepo = module.get<OrderRepository>(OrderRepository);
    orgService = module.get<OrganizationService>(IORGANIZATION_CONTRACT);
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
            price: 30,
            product_id,
            quantity: 2,
          },
        ],
      },
    });

    org_id = org.id;
    user_id = user.id;
    order_id = order.id;
    cat_id = cat.id;
    product_id = prod1.id;
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
    expect(updateOrderUseCase).toBeDefined();
    expect(orderService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(orderRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(user_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(product_id).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(order_id).toBeDefined();
  });
});
