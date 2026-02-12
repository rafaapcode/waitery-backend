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
    GOOGLE_MAPS_API_KEY: 'https://nominatim_teste.openstreetmap.org/search',
  },
}));

import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Category } from 'generated/prisma';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Product } from 'src/core/domain/entities/product';
import { PrismaService } from 'src/infra/database/database.service';
import { IngredientRepository } from 'src/modules/ingredient/repo/ingredient.repository';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
    IORGANIZATION_CONTRACT,
    IPRODUCT_CONTRACT,
    ISTORAGE_SERVICE,
    IUTILS_SERVICE,
} from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { GetProductUseCase } from '../../usecases/GetProductUseCase';

describe('Get Product Usecase', () => {
  let getProductUseCase: GetProductUseCase;
  let productService: IProductContract;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let storageService: IStorageGw;
  let productRepo: ProductRepository;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let org_id: string;
  let user_id: string;
  let cat: Category;
  let prod_id: string;
  let factoriesService: FactoriesService;

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
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

    getProductUseCase = modules.get<GetProductUseCase>(GetProductUseCase);
    productService = modules.get<ProductService>(IPRODUCT_CONTRACT);
    productRepo = modules.get<ProductRepository>(ProductRepository);
    orgService = modules.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = modules.get<OrganizationRepo>(OrganizationRepo);
    prismaService = modules.get<PrismaService>(PrismaService);
    utilsService = modules.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = modules.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = modules.get<FactoriesService>(FactoriesService);

    const org = await factoriesService.generateOrganizationWithOwner();

    const category = await factoriesService.generateCategoryInfo(
      org.organization.id,
    );

    const [ing1, ing2] = await factoriesService.generateManyIngredients(2);

    const ings = [
      { name: ing1.name, icon: ing1.icon },
      { name: ing2.name, icon: ing2.icon },
    ];
    const prod = await factoriesService.generateProductInfo(
      org.organization.id,
      category.id,
      ings,
    );

    org_id = org.organization.id;
    cat = category;
    user_id = org.owner.id;
    prod_id = prod.id;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({});
    await prismaService.ingredient.deleteMany({});
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
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
    expect(cat).toBeDefined();
    expect(user_id).toBeDefined();
    expect(prod_id).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should throw an error if organization does not exist', async () => {
    // Assert
    await expect(
      getProductUseCase.execute(faker.string.uuid(), prod_id),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if product does not exist', async () => {
    // Assert
    await expect(
      getProductUseCase.execute(org_id, faker.string.uuid()),
    ).rejects.toThrow(NotFoundException);
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
    expect(product.category.formatCategory()).toBe(`${cat.icon} ${cat.name}`);
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
    expect(product.category.formatCategory()).toBe(`${cat.icon} ${cat.name}`);
  });
});
