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
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Product } from 'src/core/domain/entities/product';
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
import { CreateProductDto } from '../../dto/create-product.dto';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { CreateProductUseCase } from '../../usecases/CreateProductUseCase';

describe('Create Product Usecase', () => {
  let createProductUseCase: CreateProductUseCase;
  let productService: IProductContract;
  let catService: ICategoryContract;
  let storageService: IStorageGw;
  let catRepo: CategoryRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let ingService: IIngredientContract;
  let ingRepo: IngredientRepository;
  let utilsService: IUtilsContract;
  let productRepo: ProductRepository;
  let prismaService: PrismaService;
  let org_id: string;
  let cat_id: string;
  let ing_ids: string[];

  const ownerId = faker.string.uuid();
  const orgName = faker.company.name();
  const orgEmail = faker.internet.email();
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
  const ingredient1Name = faker.commerce.productMaterial();
  const ingredient2Name = faker.commerce.productMaterial();
  const ingredient3Name = faker.commerce.productMaterial();
  const ingredient4Name = faker.commerce.productMaterial();
  const productName = faker.commerce.productName();
  const productPrice = faker.number.int({ min: 50, max: 500 });

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductUseCase,
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

    createProductUseCase =
      modules.get<CreateProductUseCase>(CreateProductUseCase);

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

    const { id } = await prismaService.organization.create({
      data: {
        name: orgName,
        image_url: faker.image.url(),
        email: orgEmail,
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
        owner_id: ownerId,
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

    org_id = id;
    ing_ids = [ing1.id, ing2.id, ing3.id, ing4.id];
    cat_id = cat_id_db;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({ where: { name: productName } });
    await prismaService.category.deleteMany({ where: { name: categoryName } });
    await prismaService.ingredient.deleteMany({
      where: { icon: ingredientIcon },
    });
    await prismaService.organization.deleteMany({
      where: { owner_id: ownerId },
    });
  });

  it('Should all services be defined', () => {
    expect(createProductUseCase).toBeDefined();
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
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
    expect(ing_ids.length).toBe(4);
  });

  it('Should create a new product', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: cat_id,
      description: faker.lorem.paragraph(),
      name: productName,
      ingredients: ing_ids,
      price: productPrice,
    };
    jest
      .spyOn(storageService, 'uploadFile')
      .mockResolvedValue({ fileKey: 'https://test-cdn.com/file.jpg' });

    // Act
    const product = await createProductUseCase.execute(data, org_id);

    // Assert
    expect(product).toBeInstanceOf(Product);
    expect(product.ingredients.length).toBe(4);
    expect(product.category.name).toBe(categoryName);
  });

  it('Should throw an error if the category does not exists', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: faker.string.uuid(),
      description: faker.lorem.paragraph(),
      name: faker.commerce.productName(),
      ingredients: ing_ids,
      price: faker.number.int({ min: 50, max: 500 }),
    };

    // Assert
    await expect(createProductUseCase.execute(data, org_id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw an error if the ingredients doest not exists', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: faker.string.uuid(),
      description: faker.lorem.paragraph(),
      name: faker.commerce.productName(),
      ingredients: [],
      price: faker.number.int({ min: 50, max: 500 }),
    };

    // Assert
    await expect(createProductUseCase.execute(data, org_id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw an error if the ingredients os greater then the ingredients on the db', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: faker.string.uuid(),
      description: faker.lorem.paragraph(),
      name: faker.commerce.productName(),
      ingredients: [...ing_ids, faker.string.uuid()],
      price: faker.number.int({ min: 50, max: 500 }),
    };

    // Assert
    await expect(createProductUseCase.execute(data, org_id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw an error if the org does not exists', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: cat_id,
      description: faker.lorem.paragraph(),
      name: faker.commerce.productName(),
      ingredients: ing_ids,
      price: faker.number.int({ min: 50, max: 500 }),
    };

    // Assert
    await expect(
      createProductUseCase.execute(data, faker.string.uuid()),
    ).rejects.toThrow(NotFoundException);
    await expect(createProductUseCase.execute(data, org_id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw an error if the org does not exists', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: cat_id,
      description: faker.lorem.paragraph(),
      name: faker.commerce.productName(),
      ingredients: ing_ids,
      price: faker.number.int({ min: 50, max: 500 }),
    };

    // Assert
    await expect(
      createProductUseCase.execute(data, 'uuidqualuqer'),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the product already exists with the same name', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: cat_id,
      description: faker.lorem.paragraph(),
      name: productName,
      ingredients: ing_ids,
      price: faker.number.int({ min: 50, max: 500 }),
    };

    // Assert
    await expect(createProductUseCase.execute(data, org_id)).rejects.toThrow(
      ConflictException,
    );
  });
});
