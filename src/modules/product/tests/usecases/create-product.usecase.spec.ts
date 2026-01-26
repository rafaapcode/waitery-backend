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
import { Category } from 'generated/prisma';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { createCategoryEntity } from 'src/core/domain/entities/category';
import { createProductEntity, Product } from 'src/core/domain/entities/product';
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
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
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
  let factoriesService: FactoriesService;
  let org_id: string;
  let cat: Category;
  let ing_ids: string[];

  const productName = faker.commerce.productName();
  const productPrice = faker.number.int({ min: 50, max: 500 });

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
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
    factoriesService = modules.get<FactoriesService>(FactoriesService);

    const org = await factoriesService.generateOrganizationWithOwner();

    const category = await factoriesService.generateCategoryInfo(
      org.organization.id,
    );

    const [ing1, ing2, ing3, ing4] =
      await factoriesService.generateManyIngredients(4);

    org_id = org.organization.id;
    ing_ids = [ing1.id, ing2.id, ing3.id, ing4.id];
    cat = category;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({});
    await prismaService.category.deleteMany({});
    await prismaService.ingredient.deleteMany({});
    await prismaService.organization.deleteMany({});
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
    expect(cat).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
    expect(ing_ids.length).toBe(4);
  });

  it('Should create a new product', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: cat.id,
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
    expect(product.category.name).toBe(cat.name);
  });

  it('Should merge the ingredients repetead whena creating a new product', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: cat.id,
      description: faker.lorem.paragraph(),
      name: `${productName} with repeated ingredients`,
      ingredients: [ing_ids[0], ing_ids[1], ...ing_ids],
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
    expect(product.category.name).toBe(cat.name);
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
      category_id: cat.id,
      description: faker.lorem.paragraph(),
      name: faker.commerce.productName(),
      ingredients: ing_ids,
      price: faker.number.int({ min: 50, max: 500 }),
    };

    // Assert
    await expect(
      createProductUseCase.execute(data, faker.string.uuid()),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the org does not exists', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: cat.id,
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
      category_id: cat.id,
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

  it('Should upload a file and create the imageUrl if the image_file is provided', async () => {
    // Arrange
    const image_file = {
      originalname: faker.system.fileName(),
      buffer: Buffer.from('file_buffer'),
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;
    const data: CreateProductDto = {
      category_id: cat.id,
      description: faker.lorem.paragraph(),
      name: `${productName} With Image`,
      ingredients: ing_ids,
      price: productPrice,
    };
    const productValueMocked = createProductEntity({
      id: faker.string.uuid(),
      description: faker.lorem.paragraph(),
      name: `${productName} With Image`,
      price: productPrice,
      category: createCategoryEntity({
        ...cat,
      }),
      ingredients: ing_ids.map((id) => ({
        value: id,
        label: faker.commerce.productName(),
      })),
      org_id: org_id,
      image_url: 'https://test-cdn.com/file.jpg',
    });
    jest
      .spyOn(productService, 'uploadFile')
      .mockResolvedValue(productValueMocked);

    // Act
    const product = await createProductUseCase.execute(
      data,
      org_id,
      image_file,
    );

    // Assert
    expect(product).toBeInstanceOf(Product);
    expect(product.ingredients.length).toBe(4);
    expect(product.category.name).toBe(cat.name);
    expect(productService.uploadFile).toHaveBeenCalledTimes(1);
  });
});
