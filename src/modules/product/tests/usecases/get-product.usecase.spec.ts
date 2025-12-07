import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Product } from 'src/core/domain/entities/product';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { IngredientRepository } from 'src/modules/ingredient/repo/ingredient.repository';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { GetProductUseCase } from '../../usecases/GetProductUseCase';

describe('Get Product Usecase', () => {
  let getProductUseCase: GetProductUseCase;
  let productService: IProductContract;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let productRepo: ProductRepository;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let org_id: string;
  let user_id: string;
  let cat_id: string;
  let prod_id: string;

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductUseCase,
        ProductRepository,
        IngredientRepository,
        OrganizationRepo,
        PrismaService,
        {
          provide: IPRODUCT_CONTRACT,
          useClass: ProductService,
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
        {
          provide: IUTILS_SERVICE,
          useValue: {
            verifyCepService: jest.fn(),
            validateHash: jest.fn(),
            generateHash: jest.fn(),
          },
        },
      ],
    }).compile();

    getProductUseCase = modules.get<GetProductUseCase>(GetProductUseCase);
    productService = modules.get<ProductService>(IPRODUCT_CONTRACT);
    productRepo = modules.get<ProductRepository>(ProductRepository);
    orgService = modules.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = modules.get<OrganizationRepo>(OrganizationRepo);
    prismaService = modules.get<PrismaService>(PrismaService);
    utilsService = modules.get<IUtilsContract>(IUTILS_SERVICE);

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

    const { id } = await prismaService.organization.create({
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

    const { id: cat_id_db } = await prismaService.category.create({
      data: {
        icon: '🍏',
        name: 'Massas',
        org_id: id,
      },
    });

    const [ing1, ing2] = await Promise.all([
      prismaService.ingredient.create({
        data: {
          icon: '🥗',
          name: 'ing 1',
        },
      }),
      prismaService.ingredient.create({
        data: {
          icon: '🥗',
          name: 'ing 2',
        },
      }),
    ]);

    const prod = await prismaService.product.create({
      data: {
        name: 'name',
        description: 'description',
        image_url: 'image_url',
        ingredients: [ing1.name, ing2.name] as Prisma.JsonArray,
        price: 120,
        category_id: cat_id_db,
        org_id: id,
      },
    });

    org_id = id;
    cat_id = cat_id_db;
    user_id = user.id;
    prod_id = prod.id;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({
      where: { org_id },
    });
    await prismaService.ingredient.deleteMany({
      where: { icon: '🥗' },
    });
    await prismaService.category.deleteMany({
      where: { name: { in: ['Massas', 'Massas2'] } },
    });
    await prismaService.organization.deleteMany({
      where: {
        name: {
          in: ['Restaurante Fogo de chão', 'Restaurante Fogo de chão 2'],
        },
      },
    });
    await prismaService.user.deleteMany({
      where: { email: 'rafaap@gmail.com' },
    });
  });

  it('Should all services be defined', () => {
    expect(getProductUseCase).toBeDefined();
    expect(productService).toBeDefined();
    expect(productRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(user_id).toBeDefined();
    expect(prod_id).toBeDefined();
  });

  it('Should throw an error if organization does not exist', async () => {
    // Assert
    await expect(getProductUseCase.execute('org_id', prod_id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should throw an error if product does not exist', async () => {
    // Assert
    await expect(getProductUseCase.execute(org_id, 'prod_id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Should return the product if it exists', async () => {
    // Arrange
    const data: IProductContract.GetParams = {
      org_id,
      product_id: prod_id,
    };

    // Act
    const product = await getProductUseCase.execute(
      data.org_id,
      data.product_id,
    );

    // Assert
    expect(product).toBeInstanceOf(Product);
    expect(product.ingredients.length).toBe(2);
    expect(product.category.formatCategory()).toBe('🍏 Massas');
  });
});
