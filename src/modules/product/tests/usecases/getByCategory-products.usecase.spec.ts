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
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Product } from 'src/core/domain/entities/product';
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
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
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
  let factoriesService: FactoriesService;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let cat_id: string;
  let cat_id2: string;

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
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
    factoriesService = modules.get<FactoriesService>(FactoriesService);

    const org = await factoriesService.generateOrganizationWithOwner();

    const org2 = await factoriesService.generateOrganizationWithOwner(
      org.owner.id,
    );

    const cat = await factoriesService.generateCategoryInfo(
      org.organization.id,
    );

    const cat2 = await factoriesService.generateCategoryInfo(
      org2.organization.id,
    );

    await factoriesService.generateManyProducts(
      43,
      org.organization.id,
      cat.id,
    );

    org_id = org.organization.id;
    cat_id = cat.id;
    user_id = org.owner.id;
    cat_id2 = cat2.id;
    org_id2 = org2.organization.id;
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
