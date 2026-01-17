// Mock do módulo env ANTES de qualquer import que o utilize
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

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Product } from 'src/core/domain/entities/product';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { CategoryRepository } from 'src/modules/category/repo/category.repository';
import { IngredientRepository } from 'src/modules/ingredient/repo/ingredient.repository';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
  ISTORAGE_SERVICE,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { GetAllProductUseCase } from '../../usecases/GetAllProductsUseCase';

describe('Get All Products Usecase', () => {
  let getAllProductsUseCase: GetAllProductUseCase;
  let productService: IProductContract;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let storageService: IStorageGw;
  let productRepo: ProductRepository;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let org_id: string;
  let user_id: string;
  let cat_id: string;
  let ing_ids: string[];

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllProductUseCase,
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
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getFileKey: jest.fn(),
          },
        },
      ],
    }).compile();

    getAllProductsUseCase =
      modules.get<GetAllProductUseCase>(GetAllProductUseCase);

    productService = modules.get<ProductService>(IPRODUCT_CONTRACT);
    productRepo = modules.get<ProductRepository>(ProductRepository);
    orgService = modules.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = modules.get<OrganizationRepo>(OrganizationRepo);
    prismaService = modules.get<PrismaService>(PrismaService);
    utilsService = modules.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = modules.get<IStorageGw>(ISTORAGE_SERVICE);

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

    const [ing1, ing2, ing3, ing4] = await Promise.all([
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
      prismaService.ingredient.create({
        data: {
          icon: '🥗',
          name: 'ing 3',
        },
      }),
      prismaService.ingredient.create({
        data: {
          icon: '🥗',
          name: 'ing 4',
        },
      }),
    ]);

    await prismaService.product.createMany({
      data: Array.from({ length: 43 }).map((_, i) => ({
        name: `name - ${i}`,
        description: 'description',
        image_url: 'image_url',
        ingredients: [
          ing1.name,
          ing2.name,
          ing3.name,
          ing4.name,
        ] as Prisma.JsonArray,
        price: 5 * i + 1,
        category_id: cat_id_db,
        org_id: id,
      })),
    });

    org_id = id;
    ing_ids = [ing1.id, ing2.id, ing3.id, ing4.id];
    cat_id = cat_id_db;
    user_id = user.id;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({
      where: { org_id },
    });
    await prismaService.category.deleteMany({ where: { name: 'Massas' } });
    await prismaService.ingredient.deleteMany({
      where: { icon: '🥗' },
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
    expect(getAllProductsUseCase).toBeDefined();
    expect(productService).toBeDefined();
    expect(productRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(ing_ids.length).toBe(4);
    expect(user_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should throw an error if the org_id is invalid', async () => {
    // Assert
    await expect(
      getAllProductsUseCase.execute('invalid_org_id'),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should return the first 15 products of the org ( not pass the page )', async () => {
    // Act
    const result = await getAllProductsUseCase.execute(org_id);

    // Assert
    expect(result.products[0]).toBeInstanceOf(Product);
    expect(result.has_next).toBeTruthy();
    expect(result.products.length).toBe(15);
  });

  it('Should return the first 15 products of the org ( with the page parameter )', async () => {
    // Act
    const result = await getAllProductsUseCase.execute(org_id, 0);

    // Assert
    expect(result.products[0]).toBeInstanceOf(Product);
    expect(result.has_next).toBeTruthy();
    expect(result.products.length).toBe(15);
  });

  it('Should return the second 15 products of the org ', async () => {
    // Act
    const result = await getAllProductsUseCase.execute(org_id, 1);

    // Assert
    expect(result.products[0]).toBeInstanceOf(Product);
    expect(result.has_next).toBeTruthy();
    expect(result.products.length).toBe(15);
  });

  it('Should return the second 13 products of the org ', async () => {
    // Act
    const result = await getAllProductsUseCase.execute(org_id, 2);

    // Assert
    expect(result.products[0]).toBeInstanceOf(Product);
    expect(result.has_next).toBeFalsy();
    expect(result.products.length).toBe(13);
  });

  it('Should return the second 0 products of the org ', async () => {
    // Act
    const result = await getAllProductsUseCase.execute(org_id, 3);

    // Assert
    expect(result.products[0]).toBeUndefined();
    expect(result.has_next).toBeFalsy();
    expect(result.products.length).toBe(0);
  });
});
