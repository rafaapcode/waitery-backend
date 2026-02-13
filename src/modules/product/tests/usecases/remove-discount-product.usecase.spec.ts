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
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { RemoveDiscountToProductUseCase } from '../../usecases/RemoveDiscountToProductUseCase';

describe('Remove Discount to a Product Usecase', () => {
  let removeDiscountUseCase: RemoveDiscountToProductUseCase;
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
  let user_id: string;
  let cat_id: string;
  let prod_id: string;
  let ing_ids: string[];

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        RemoveDiscountToProductUseCase,
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

    removeDiscountUseCase = modules.get<RemoveDiscountToProductUseCase>(
      RemoveDiscountToProductUseCase,
    );
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
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({});
    await prismaService.ingredient.deleteMany({});
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(removeDiscountUseCase).toBeDefined();
    expect(productService).toBeDefined();
    expect(productRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(ingService).toBeDefined();
    expect(ingRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(user_id).toBeDefined();
    expect(prod_id).toBeDefined();
    expect(ing_ids).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
    expect(factoriesService).toBeDefined();
    expect(observabilityService).toBeDefined();
  });

  it('Should throw NotFoundException if organization does not exist', async () => {
    await expect(
      removeDiscountUseCase.execute('non-existing-org-id', prod_id),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw NotFoundException if product does not exist', async () => {
    await expect(
      removeDiscountUseCase.execute(org_id, 'non-existing-prod-id'),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should remove a discount from a product', async () => {
    await removeDiscountUseCase.execute(org_id, prod_id);
    const updatedProduct = await productService.get({
      product_id: prod_id,
      org_id,
    });
    expect(updatedProduct?.discounted_price).toBe(0);
    expect(updatedProduct?.discount).toBeFalsy();
  });
});
