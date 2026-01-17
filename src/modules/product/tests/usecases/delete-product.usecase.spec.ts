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
import { Prisma } from 'generated/prisma';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
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
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { DeleteProductUseCase } from '../../usecases/DeleteProductUseCase';

describe('Delete Product Usecase', () => {
  let deleteProductUseCase: DeleteProductUseCase;
  let productService: IProductContract;
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
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let user_id2: string;
  let cat_id: string;
  let prod_id: string;
  let ing_ids: string[];

  const user1Cpf = faker.string.numeric(11);
  const user1Name = faker.person.fullName();
  const user1Email = faker.internet.email();
  const user2Cpf = faker.string.numeric(11);
  const user2Name = faker.person.fullName();
  const user2Email = faker.internet.email();
  const org1Name = faker.company.name();
  const org1Email = faker.internet.email();
  const org1Description = faker.lorem.paragraph();
  const org2Name = faker.company.name();
  const org2Email = faker.internet.email();
  const org2Description = faker.lorem.paragraph();
  const categoryName = faker.commerce.department();
  const categoryIcon = faker.helpers.arrayElement([
    '🍏',
    '🍕',
    '🍔',
    '🍟',
    '🥗',
    '🍰',
  ]);
  const ingredientIcon = faker.helpers.arrayElement([
    '🥗',
    '🧀',
    '🥩',
    '🥬',
    '🍅',
    '🧄',
  ]);
  const ingredient1Name = `${faker.commerce.productMaterial()}-${faker.string.uuid()}`;
  const ingredient2Name = `${faker.commerce.productMaterial()}-${faker.string.uuid()}`;
  const ingredient3Name = `${faker.commerce.productMaterial()}-${faker.string.uuid()}`;
  const ingredient4Name = `${faker.commerce.productMaterial()}-${faker.string.uuid()}`;
  const productName = faker.commerce.productName();
  const productDescription = faker.lorem.paragraph();
  const productPrice = faker.number.int({ min: 50, max: 500 });

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProductUseCase,
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

    const user = await prismaService.user.create({
      data: {
        cpf: user1Cpf,
        name: user1Name,
        email: user1Email,
        password: faker.internet.password({ length: 20 }),
        role: UserRole.OWNER,
      },
    });

    const user2 = await prismaService.user.create({
      data: {
        cpf: user2Cpf,
        name: user2Name,
        email: user2Email,
        password: faker.internet.password({ length: 20 }),
        role: UserRole.ADMIN,
      },
    });

    const { id } = await prismaService.organization.create({
      data: {
        name: org1Name,
        image_url: faker.image.url(),
        email: org1Email,
        description: org1Description,
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

    const { id: org2_id } = await prismaService.organization.create({
      data: {
        name: org2Name,
        image_url: faker.image.url(),
        email: org2Email,
        description: org2Description,
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
        name: categoryName,
        org_id: id,
      },
    });

    const [ing1, ing2, ing3, ing4] = await Promise.all([
      prismaService.ingredient.create({
        data: {
          icon: ingredientIcon,
          name: ingredient1Name,
        },
      }),
      prismaService.ingredient.create({
        data: {
          icon: ingredientIcon,
          name: ingredient2Name,
        },
      }),
      prismaService.ingredient.create({
        data: {
          icon: ingredientIcon,
          name: ingredient3Name,
        },
      }),
      prismaService.ingredient.create({
        data: {
          icon: ingredientIcon,
          name: ingredient4Name,
        },
      }),
    ]);

    const prod = await prismaService.product.create({
      data: {
        name: productName,
        description: productDescription,
        image_url: faker.image.url(),
        ingredients: [
          ing1.name,
          ing2.name,
          ing3.name,
          ing4.name,
        ] as Prisma.JsonArray,
        price: productPrice,
        category_id: cat_id_db,
        org_id: id,
      },
    });

    prod_id = prod.id;
    org_id = id;
    ing_ids = [ing1.id, ing2.id, ing3.id, ing4.id];
    cat_id = cat_id_db;
    org_id2 = org2_id;
    user_id = user.id;
    user_id2 = user2.id;
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
