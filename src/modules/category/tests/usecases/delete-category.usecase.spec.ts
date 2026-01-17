import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { PrismaService } from 'src/infra/database/database.service';
import { ICATEGORY_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';
import { DeleteCategoryUseCase } from '../../usecases/DeleteCategoryUseCase';

describe('Delete Category UseCase', () => {
  let deleteCategoryUseCAse: DeleteCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;

  const ownerId = faker.string.uuid();
  const orgName = faker.company.name();
  const orgEmail = faker.internet.email();
  const orgDescription = faker.lorem.paragraph();
  const cityName = faker.location.city();
  const locationCode =
    faker.location.countryCode('alpha-2') +
    '-' +
    faker.location.state({ abbreviated: true }) +
    '-' +
    faker.string.numeric(3);
  const openHour = faker.number.int({ min: 6, max: 10 });
  const closeHour = faker.number.int({ min: 18, max: 23 });
  const categoryIcon = faker.internet.emoji();
  const categoryName = faker.commerce.department();
  const productName = faker.commerce.productName();
  const productDescription = faker.commerce.productDescription();
  const productPrice = faker.number.int({ min: 10, max: 500 });
  const ingredientName = faker.lorem.word();
  const nonExistentCategoryId = faker.string.uuid();
  const wrongOrgId = faker.string.uuid();

  const owner_id = ownerId;
  let org_id: string;
  let category_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCategoryUseCase,
        PrismaService,
        CategoryRepository,
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
      ],
    }).compile();

    deleteCategoryUseCAse = module.get<DeleteCategoryUseCase>(
      DeleteCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<ICategoryContract>(ICATEGORY_CONTRACT);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);

    const { id: org_id_db } = await prismaService.organization.create({
      data: {
        name: orgName,
        image_url: faker.image.url(),
        email: orgEmail,
        description: orgDescription,
        location_code: locationCode,
        open_hour: openHour,
        close_hour: closeHour,
        cep: faker.location.zipCode(),
        city: cityName,
        neighborhood: faker.location.street(),
        street: faker.location.streetAddress(),
        lat: faker.location.latitude(),
        long: faker.location.longitude(),
        owner_id,
      },
    });

    const { id: cat_id_db } = await prismaService.category.create({
      data: {
        icon: categoryIcon,
        name: categoryName,
        org_id: org_id_db,
      },
    });

    await prismaService.product.create({
      data: {
        name: productName,
        description: productDescription,
        image_url: faker.image.url(),
        ingredients: [ingredientName],
        price: productPrice,
        category_id: cat_id_db,
        org_id: org_id_db,
      },
    });

    org_id = org_id_db;
    category_id = cat_id_db;
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(deleteCategoryUseCAse).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(category_id).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should throw an error if the category does not exists', async () => {
    //Assert
    await expect(
      deleteCategoryUseCAse.execute(nonExistentCategoryId, org_id),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the organization does not match', async () => {
    //Assert
    await expect(
      deleteCategoryUseCAse.execute(category_id, wrongOrgId),
    ).rejects.toThrow(BadRequestException);
  });

  it('Should throw an error if the category is being used by a product', async () => {
    //Assert
    await expect(
      deleteCategoryUseCAse.execute(category_id, org_id),
    ).rejects.toThrow(ConflictException);
  });

  it('Should delete a category', async () => {
    await prismaService.product.deleteMany({
      where: { org_id },
    });

    // Arrange
    const old_cat = await prismaService.category.findUnique({
      where: { id: category_id },
    });

    // Act
    await deleteCategoryUseCAse.execute(category_id, org_id);
    const actual_cat = await prismaService.category.findUnique({
      where: { id: category_id },
    });

    //Assert
    expect(old_cat).toBeDefined();
    expect(actual_cat).toBeNull();
  });
});
