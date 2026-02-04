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
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { PrismaService } from 'src/infra/database/database.service';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IngredientService } from 'src/modules/ingredient/ingredient.service';
import { IngredientRepository } from 'src/modules/ingredient/repo/ingredient.repository';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  IINGREDIENT_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
  ISTORAGE_SERVICE,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { UpdateProductDto } from '../../dto/update-product.dto';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { UpdateProductUseCase } from '../../usecases/UpdateProductUseCase';

describe('Update Product Usecase', () => {
  let updateProductUseCase: UpdateProductUseCase;
  let observabilityService: ObservabilityService;
  let productService: IProductContract;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let ingService: IIngredientContract;
  let storageService: IStorageGw;
  let ingRepo: IngredientRepository;
  let productRepo: ProductRepository;
  let prismaService: PrismaService;
  let factoriesService: FactoriesService;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let cat_id: string;
  let prod_id: string;
  let ing_ids: string[];

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        UpdateProductUseCase,
        ProductRepository,
        IngredientRepository,
        OrganizationRepo,
        PrismaService,
        ObservabilityService,
        {
          provide: IPRODUCT_CONTRACT,
          useClass: ProductService,
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
        {
          provide: IINGREDIENT_CONTRACT,
          useClass: IngredientService,
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

    updateProductUseCase =
      modules.get<UpdateProductUseCase>(UpdateProductUseCase);
    productService = modules.get<ProductService>(IPRODUCT_CONTRACT);
    productRepo = modules.get<ProductRepository>(ProductRepository);
    orgService = modules.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = modules.get<OrganizationRepo>(OrganizationRepo);
    ingService = modules.get<IIngredientContract>(IINGREDIENT_CONTRACT);
    ingRepo = modules.get<IngredientRepository>(IngredientRepository);
    prismaService = modules.get<PrismaService>(PrismaService);
    utilsService = modules.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = modules.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = modules.get<FactoriesService>(FactoriesService);
    observabilityService =
      modules.get<ObservabilityService>(ObservabilityService);

    const org = await factoriesService.generateOrganizationWithOwner();

    const org2 = await factoriesService.generateOrganizationWithOwner(
      org.organization.id,
    );

    const cat = await factoriesService.generateCategoryInfo(
      org.organization.id,
    );

    const [ing1, ing2] = await factoriesService.generateManyIngredients(2);

    const ings = [{ name: ing1.name, icon: ing1.icon }];
    const prod = await factoriesService.generateProductInfo(
      org.organization.id,
      cat.id,
      ings,
    );

    org_id = org.organization.id;
    cat_id = cat.id;
    user_id = org.owner.id;
    prod_id = prod.id;
    ing_ids = [ing1.id, ing2.id];
    org_id2 = org2.organization.id;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({});
    await prismaService.ingredient.deleteMany({});
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(updateProductUseCase).toBeDefined();
    expect(productService).toBeDefined();
    expect(productRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(ingService).toBeDefined();
    expect(ingRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(user_id).toBeDefined();
    expect(prod_id).toBeDefined();
    expect(ing_ids).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
    expect(factoriesService).toBeDefined();
    expect(observabilityService).toBeDefined();
  });

  it('Should not be able to update a product if organization does not exist', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: faker.commerce.productName(),
      price: faker.number.int({ min: 50, max: 500 }),
    };
    // Assert
    await expect(
      updateProductUseCase.execute(faker.string.uuid(), prod_id, data),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should not be able to update a product if product does not exist', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: faker.commerce.productName(),
      price: faker.number.int({ min: 50, max: 500 }),
    };

    // Assert
    await expect(
      updateProductUseCase.execute(org_id, faker.string.uuid(), data),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should not be able to update a product if product is not related with the org', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: faker.commerce.productName(),
      price: faker.number.int({ min: 50, max: 500 }),
    };

    // Assert
    await expect(
      updateProductUseCase.execute(org_id2, prod_id, data),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should  be able to update a product', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: faker.commerce.productName(),
      price: faker.number.int({ min: 200, max: 600 }),
    };
    const old_product = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Act
    await updateProductUseCase.execute(org_id, prod_id, data);

    const new_product = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Assert
    expect(old_product).toBeDefined();
    expect(new_product).toBeDefined();
    expect(old_product!.id).toEqual(new_product!.id);
    expect(old_product!.name).not.toEqual(new_product!.name);
    expect(old_product!.price).not.toEqual(new_product!.price);
    expect(new_product!.name).toEqual(data.name);
    expect(new_product!.price).toEqual(data.price);
    expect(new_product!.discount).toBeFalsy();
    expect(old_product!.ingredients).toEqual(new_product!.ingredients);
  });

  it('Should  be able to update a product with new ingredients', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: faker.commerce.productName(),
      ingredients: ing_ids,
    };
    const old_product = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Act
    await updateProductUseCase.execute(org_id, prod_id, data);

    const new_product = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Assert
    expect(old_product).toBeDefined();
    expect(new_product).toBeDefined();
    expect(old_product!.id).toEqual(new_product!.id);
    expect(old_product!.name).not.toEqual(new_product!.name);
    expect(old_product!.ingredients).not.toEqual(new_product!.ingredients);
  });
});
