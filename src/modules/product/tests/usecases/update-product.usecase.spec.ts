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
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
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
import { UpdateProductDto } from '../../dto/update-product.dto';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { UpdateProductUseCase } from '../../usecases/UpdateProductUseCase';

describe('Update Product Usecase', () => {
  let updateProductUseCase: UpdateProductUseCase;
  let productService: IProductContract;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let ingService: IIngredientContract;
  let storageService: IStorageGw;
  let ingRepo: IngredientRepository;
  let productRepo: ProductRepository;
  let prismaService: PrismaService;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let cat_id: string;
  let prod_id: string;
  let ing_ids: string[];

  const userCpf = faker.string.numeric(11);
  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
  const org1Name = faker.company.name();
  const org1Email = faker.internet.email();
  const org2Name = faker.company.name();
  const org2Email = faker.internet.email();
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
  const productName = faker.commerce.productName();
  const productDescription = faker.lorem.paragraph();
  const productPrice = faker.number.int({ min: 50, max: 500 });

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProductUseCase,
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
        name: productName,
        description: productDescription,
        image_url: faker.image.url(),
        ingredients: [ing1.name] as Prisma.JsonArray,
        price: productPrice,
        category_id: cat_id_db,
        org_id: id,
      },
    });

    org_id = id;
    cat_id = cat_id_db;
    user_id = user.id;
    prod_id = prod.id;
    ing_ids = [ing1.id, ing2.id];
    org_id2 = org2.id;
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
