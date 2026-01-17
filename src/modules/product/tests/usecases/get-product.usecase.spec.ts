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
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Product } from 'src/core/domain/entities/product';
import { UserRole } from 'src/core/domain/entities/user';
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
  let cat_id: string;
  let prod_id: string;

  const userCpf = faker.string.numeric(11);
  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
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
  const productPrice = faker.number.int({ min: 50, max: 500 });

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
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

    const [ing1, ing2] = await Promise.all([
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
    ]);

    const prod = await prismaService.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.lorem.paragraph(),
        image_url: faker.image.url(),
        ingredients: [ing1.name, ing2.name] as Prisma.JsonArray,
        price: productPrice,
        category_id: cat_id_db,
        org_id: id,
      },
    });

    org_id = id;
    cat_id = cat_id_db;
    user_id = user.id;
    prod_id = prod.id;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({
      where: { org_id },
    });
    await prismaService.ingredient.deleteMany({
      where: { icon: ingredientIcon },
    });
    await prismaService.category.deleteMany({
      where: { name: categoryName },
    });
    await prismaService.organization.deleteMany({
      where: {
        name: orgName,
      },
    });
    await prismaService.user.deleteMany({
      where: { email: userEmail },
    });
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
    expect(cat_id).toBeDefined();
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
    expect(product.category.formatCategory()).toBe(
      `${categoryIcon} ${categoryName}`,
    );
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
    expect(product.category.formatCategory()).toBe(
      `${categoryIcon} ${categoryName}`,
    );
  });
});
