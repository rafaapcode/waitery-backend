import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Product } from 'src/core/domain/entities/product';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { CategoryService } from 'src/modules/category/category.service';
import { CategoryRepository } from 'src/modules/category/repo/category.repository';
import { IngredientRepository } from 'src/modules/ingredient/repo/ingredient.repository';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  ICATEGORY_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { GetProductByCategoryUseCase } from '../../usecases/GetProductByCategoryUseCase';

describe('Get Products By Category Usecase', () => {
  let getProductByCategoryUseCase: GetProductByCategoryUseCase;
  let productService: IProductContract;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let catService: ICategoryContract;
  let catRepo: CategoryRepository;
  let productRepo: ProductRepository;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let cat_id: string;
  let cat_id2: string;

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductByCategoryUseCase,
        CategoryRepository,
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
          provide: ICATEGORY_CONTRACT,
          useClass: CategoryService,
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

    getProductByCategoryUseCase = modules.get<GetProductByCategoryUseCase>(
      GetProductByCategoryUseCase,
    );
    productService = modules.get<ProductService>(IPRODUCT_CONTRACT);
    productRepo = modules.get<ProductRepository>(ProductRepository);
    orgService = modules.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = modules.get<OrganizationRepo>(OrganizationRepo);
    catService = modules.get<ICategoryContract>(ICATEGORY_CONTRACT);
    catRepo = modules.get<CategoryRepository>(CategoryRepository);
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

    const org2 = await prismaService.organization.create({
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

    const { id: cat_id_db2 } = await prismaService.category.create({
      data: {
        icon: '🍏',
        name: 'Massas2',
        org_id: org2.id,
      },
    });
    await prismaService.product.createMany({
      data: Array.from({ length: 43 }).map((_, i) => ({
        name: `name - ${i}`,
        description: 'description',
        image_url: 'image_url',
        ingredients: [] as Prisma.JsonArray,
        price: 5 * i + 1,
        category_id: cat_id_db,
        org_id: id,
      })),
    });

    org_id = id;
    cat_id = cat_id_db;
    user_id = user.id;
    cat_id2 = cat_id_db2;
    org_id2 = org2.id;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({
      where: { org_id },
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
    expect(getProductByCategoryUseCase).toBeDefined();
    expect(productService).toBeDefined();
    expect(productRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(catService).toBeDefined();
    expect(catRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(user_id).toBeDefined();
  });

  it('Should throw an error if the org_id is invalid', async () => {
    // Assert
    await expect(
      getProductByCategoryUseCase.execute('invalid_org_id', cat_id),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the cat_id is invalid', async () => {
    // Assert
    await expect(
      getProductByCategoryUseCase.execute(org_id, 'invalid_cat_id'),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should return 0 products if not found', async () => {
    // Act
    const result = await getProductByCategoryUseCase.execute(org_id2, cat_id2);

    // Assert
    expect(result.has_next).toBeFalsy();
    expect(result.products.length).toBe(0);
    expect(result.products[0]).toBeUndefined();
  });

  it('Should return 15 products of a category ( without the page parameter )', async () => {
    // Act
    const result = await getProductByCategoryUseCase.execute(org_id, cat_id);

    // Assert
    expect(result.has_next).toBeTruthy();
    expect(result.products.length).toBe(15);
    expect(result.products[0]).toBeInstanceOf(Product);
  });

  it('Should return 15 products of a category ( with the page parameter )', async () => {
    // Act
    const result = await getProductByCategoryUseCase.execute(org_id, cat_id, 0);

    // Assert
    expect(result.has_next).toBeTruthy();
    expect(result.products.length).toBe(15);
    expect(result.products[0]).toBeInstanceOf(Product);
  });

  it('Should return 15 products on the second page filter by a category', async () => {
    // Act
    const result = await getProductByCategoryUseCase.execute(org_id, cat_id, 1);

    // Assert
    expect(result.has_next).toBeTruthy();
    expect(result.products.length).toBe(15);
    expect(result.products[0]).toBeInstanceOf(Product);
  });

  it('Should return 13 products on the thir page filter by a category', async () => {
    // Act
    const result = await getProductByCategoryUseCase.execute(org_id, cat_id, 2);

    // Assert
    expect(result.has_next).toBeFalsy();
    expect(result.products.length).toBe(13);
    expect(result.products[0]).toBeInstanceOf(Product);
  });

  it('Should return 0 products on the fourth page filter by a category', async () => {
    // Act
    const result = await getProductByCategoryUseCase.execute(org_id, cat_id, 3);

    // Assert
    expect(result.has_next).toBeFalsy();
    expect(result.products.length).toBe(0);
    expect(result.products[0]).toBeUndefined();
  });

  it('Should throw an error if the org_id is not related with the category', async () => {
    // Assert
    await expect(
      getProductByCategoryUseCase.execute(org_id2, cat_id, 3),
    ).rejects.toThrow(NotFoundException);
  });
});
