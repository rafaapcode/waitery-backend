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
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { CategoryService } from 'src/modules/category/category.service';
import { CategoryRepository } from 'src/modules/category/repo/category.repository';
import { IngredientService } from 'src/modules/ingredient/ingredient.service';
import { IngredientRepository } from 'src/modules/ingredient/repo/ingredient.repository';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  ICATEGORY_CONTRACT,
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
import { DeleteProductUseCase } from '../../usecases/DeleteProductUseCase';

describe('Delete Product Usecase', () => {
  let deleteProductUseCase: DeleteProductUseCase;
  let productService: IProductContract;
  let observabilityService: ObservabilityService;
  let catService: ICategoryContract;
  let storageService: IStorageGw;
  let catRepo: CategoryRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let ingService: IIngredientContract;
  let ingRepo: IngredientRepository;
  let productRepo: ProductRepository;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let factoriesService: FactoriesService;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let user_id2: string;
  let cat_id: string;
  let prod_id: string;
  let ing_ids: string[];

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        DeleteProductUseCase,
        CategoryRepository,
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
          provide: ICATEGORY_CONTRACT,
          useClass: CategoryService,
        },
        {
          provide: IINGREDIENT_CONTRACT,
          useClass: IngredientService,
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

    deleteProductUseCase =
      modules.get<DeleteProductUseCase>(DeleteProductUseCase);

    productService = modules.get<ProductService>(IPRODUCT_CONTRACT);
    productRepo = modules.get<ProductRepository>(ProductRepository);
    catService = modules.get<CategoryService>(ICATEGORY_CONTRACT);
    catRepo = modules.get<CategoryRepository>(CategoryRepository);
    ingService = modules.get<IngredientService>(IINGREDIENT_CONTRACT);
    ingRepo = modules.get<IngredientRepository>(IngredientRepository);
    orgService = modules.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = modules.get<OrganizationRepo>(OrganizationRepo);
    prismaService = modules.get<PrismaService>(PrismaService);
    utilsService = modules.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = modules.get<IStorageGw>(ISTORAGE_SERVICE);
    factoriesService = modules.get<FactoriesService>(FactoriesService);
    observabilityService =
      modules.get<ObservabilityService>(ObservabilityService);

    const user = await factoriesService.generateUserInfo();

    const org = await factoriesService.generateOrganizationWithOwner();

    const org2 = await factoriesService.generateOrganizationWithOwner(
      org.owner.id,
    );

    const cat = await factoriesService.generateCategoryInfo(
      org.organization.id,
    );

    const [ing1, ing2, ing3, ing4] =
      await factoriesService.generateManyIngredients(4);

    const ings = [
      { name: ing1.name, icon: ing1.icon },
      { name: ing2.name, icon: ing2.icon },
      { name: ing3.name, icon: ing3.icon },
      { name: ing4.name, icon: ing4.icon },
    ];
    const prod = await factoriesService.generateProductInfo(
      org.organization.id,
      cat.id,
      ings,
    );

    prod_id = prod.id;
    org_id = org.organization.id;
    ing_ids = [ing1.id, ing2.id, ing3.id, ing4.id];
    cat_id = cat.id;
    org_id2 = org2.organization.id;
    user_id = org.owner.id;
    user_id2 = user.id;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({});
    await prismaService.category.deleteMany({});
    await prismaService.ingredient.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(deleteProductUseCase).toBeDefined();
    expect(productService).toBeDefined();
    expect(productRepo).toBeDefined();
    expect(catService).toBeDefined();
    expect(catRepo).toBeDefined();
    expect(ingService).toBeDefined();
    expect(ingRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(prod_id).toBeDefined();
    expect(ing_ids.length).toBe(4);
    expect(org_id2).toBeDefined();
    expect(user_id).toBeDefined();
    expect(user_id2).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
    expect(factoriesService).toBeDefined();
    expect(observabilityService).toBeDefined();
  });

  it('Should throw an error if the product does not exist', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(
        faker.string.uuid(),
        org_id,
        user_id,
        UserRole.OWNER,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the org does not exist', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(
        prod_id,
        faker.string.uuid(),
        user_id,
        UserRole.OWNER,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the product does not exist', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(
        faker.string.uuid(),
        org_id,
        user_id,
        UserRole.OWNER,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the org does not exist', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(
        prod_id,
        faker.string.uuid(),
        user_id,
        UserRole.OWNER,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the product is not related with the org', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(prod_id, org_id2, user_id, UserRole.OWNER),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the user is not related with the org ADMIN', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(prod_id, org_id2, user_id2, UserRole.ADMIN),
    ).rejects.toThrow(ConflictException);
  });

  it('Should throw an error if the user is not related with the org OWNER', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(prod_id, org_id2, user_id2, UserRole.OWNER),
    ).rejects.toThrow(ConflictException);
  });

  it('Should delete a product', async () => {
    // Arrange
    const product = await prismaService.product.findUnique({
      where: { id: prod_id },
    });
    jest
      .spyOn(storageService, 'deleteFile')
      .mockResolvedValue({ success: true });

    // Act
    await deleteProductUseCase.execute(
      prod_id,
      org_id,
      user_id,
      UserRole.OWNER,
    );

    const productDeleted = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Assert
    expect(product).toBeDefined();
    expect(productDeleted).toBeNull();
  });
});
