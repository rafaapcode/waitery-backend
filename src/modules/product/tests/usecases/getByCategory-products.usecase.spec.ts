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

import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
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
  ISTORAGE_SERVICE,
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
  let storageService: IStorageGw;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let cat_id: string;
  let cat_id2: string;

  const userCpf = faker.string.numeric(11);
  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
  const org1Name = faker.company.name();
  const org1Email = faker.internet.email();
  const org2Name = faker.company.name();
  const org2Email = faker.internet.email();
  const category1Name = faker.commerce.department();
  const category2Name = faker.commerce.department();
  const categoryIcon = faker.helpers.arrayElement([
    '🍏',
    '🍕',
    '🍔',
    '🍟',
    '🥗',
    '🍰',
  ]);

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
    storageService = modules.get<IStorageGw>(ISTORAGE_SERVICE);

    const user = await prismaService.user.create({
      data: {
        cpf: userCpf,
        name: userName,
        email: userEmail,
        password: faker.internet.password({ length: 20 }),
        role: UserRole.OWNER,
      },
    });

    const { id } = await prismaService.organization.create({
      data: {
        name: org1Name,
        image_url: faker.image.url(),
        email: org1Email,
        description: faker.lorem.paragraph(),
        location_code:
          faker.location.countryCode('alpha-2') +
          '-' +
          faker.location.state({ abbreviated: true }) +
          '-' +
          faker.string.numeric(3),
        open_hour: faker.number.int({ min: 6, max: 10 }),
        close_hour: faker.number.int({ min: 18, max: 23 }),
        cep: faker.location.zipCode(),
        city: faker.location.city(),
        neighborhood: faker.location.street(),
        street: faker.location.streetAddress(),
        lat: faker.location.latitude(),
        long: faker.location.longitude(),
        owner_id: user.id,
      },
    });

    const org2 = await prismaService.organization.create({
      data: {
        name: org2Name,
        image_url: faker.image.url(),
        email: org2Email,
        description: faker.lorem.paragraph(),
        location_code:
          faker.location.countryCode('alpha-2') +
          '-' +
          faker.location.state({ abbreviated: true }) +
          '-' +
          faker.string.numeric(3),
        open_hour: faker.number.int({ min: 6, max: 10 }),
        close_hour: faker.number.int({ min: 18, max: 23 }),
        cep: faker.location.zipCode(),
        city: faker.location.city(),
        neighborhood: faker.location.street(),
        street: faker.location.streetAddress(),
        lat: faker.location.latitude(),
        long: faker.location.longitude(),
        owner_id: user.id,
      },
    });

    const { id: cat_id_db } = await prismaService.category.create({
      data: {
        icon: categoryIcon,
        name: category1Name,
        org_id: id,
      },
    });

    const { id: cat_id_db2 } = await prismaService.category.create({
      data: {
        icon: categoryIcon,
        name: category2Name,
        org_id: org2.id,
      },
    });
    await prismaService.product.createMany({
      data: Array.from({ length: 43 }).map((_, i) => ({
        name: `${faker.commerce.productName()} - ${i}`,
        description: faker.lorem.sentence(),
        image_url: faker.image.url(),
        ingredients: [] as Prisma.JsonArray,
        price: faker.number.int({ min: 10, max: 500 }),
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
    await prismaService.product.deleteMany({});
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
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
    expect(storageService).toBeDefined();
  });

  it('Should throw an error if the org_id is invalid', async () => {
    // Assert
    await expect(
      getProductByCategoryUseCase.execute(faker.string.uuid(), cat_id),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the cat_id is invalid', async () => {
    // Assert
    await expect(
      getProductByCategoryUseCase.execute(org_id, faker.string.uuid()),
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
