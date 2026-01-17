import { faker } from '@faker-js/faker';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Category } from 'src/core/domain/entities/category';
import { PrismaService } from 'src/infra/database/database.service';
import { ICATEGORY_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';
import { UpdateCategoryUseCase } from '../../usecases/UpdateCategoryUseCase';

describe('Update Category UseCase', () => {
  let updateCategoryUseCase: UpdateCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;

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
  const newIcon1 = faker.internet.emoji();
  const newName1 = faker.commerce.department();
  const newIcon2 = faker.internet.emoji();
  const newName2 = faker.commerce.department();
  const nonExistentCatId = faker.string.uuid();
  const wrongOrgId = faker.string.uuid();

  const owner_id = ownerId;
  let org_id: string;
  let cat_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCategoryUseCase,
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

    updateCategoryUseCase = module.get<UpdateCategoryUseCase>(
      UpdateCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<ICategoryContract>(ICATEGORY_CONTRACT);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);

    const { id } = await prismaService.organization.create({
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
        org_id: id,
      },
    });

    org_id = id;
    cat_id = cat_id_db;
  });

  afterAll(async () => {
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(updateCategoryUseCase).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should update ONLY THE ICON of a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat_id,
      category: {
        icon: newIcon1,
      },
    };
    const old_cat = await prismaService.category.findUnique({
      where: { id: cat_id },
    });

    // Act
    const updated_cat = await updateCategoryUseCase.execute(
      data.id,
      org_id,
      data.category,
    );

    // Assert
    expect(updated_cat).toBeInstanceOf(Category);
    expect(updated_cat.id).toBe(cat_id);
    expect(updated_cat.org_id).toBe(org_id);
    expect(updated_cat.icon).not.toBe(old_cat?.icon);
  });

  it('Should update ONLY THE NAME of a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat_id,
      category: {
        name: newName1,
      },
    };
    const old_cat = await prismaService.category.findUnique({
      where: { id: cat_id },
    });

    // Act
    const updated_cat = await updateCategoryUseCase.execute(
      data.id,
      org_id,
      data.category,
    );

    // Assert
    expect(updated_cat).toBeInstanceOf(Category);
    expect(updated_cat.id).toBe(cat_id);
    expect(updated_cat.org_id).toBe(org_id);
    expect(updated_cat.name).not.toBe(old_cat?.name);
  });

  it('Should update THE BOTH FIELDS of a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat_id,
      category: {
        name: newName2,
        icon: newIcon2,
      },
    };
    const old_cat = await prismaService.category.findUnique({
      where: { id: cat_id },
    });

    // Act
    const updated_cat = await updateCategoryUseCase.execute(
      data.id,
      org_id,
      data.category,
    );

    // Assert
    expect(updated_cat).toBeInstanceOf(Category);
    expect(updated_cat.id).toBe(cat_id);
    expect(updated_cat.org_id).toBe(org_id);
    expect(updated_cat.name).not.toBe(old_cat?.name);
    expect(updated_cat.icon).not.toBe(old_cat?.icon);
  });

  it('Should throw a NotFoundException if the category does not exist', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat_id,
      category: {
        name: newName2,
        icon: newIcon2,
      },
    };

    // Assert
    await expect(
      updateCategoryUseCase.execute(nonExistentCatId, org_id, data.category),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw a BadRequestException if the organization does not match', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat_id,
      category: {
        name: newName2,
        icon: newIcon2,
      },
    };

    // Assert
    await expect(
      updateCategoryUseCase.execute(data.id, wrongOrgId, data.category),
    ).rejects.toThrow(BadRequestException);
  });
});
