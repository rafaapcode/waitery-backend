import { faker } from '@faker-js/faker';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Category } from 'src/core/domain/entities/category';
import { PrismaService } from 'src/infra/database/database.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  ICATEGORY_CONTRACT,
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';
import { CreateCategoryUseCase } from '../../usecases/CreateCategoryUseCase';

describe('Create Category UseCase', () => {
  let createCategoryUseCase: CreateCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;
  let storageService: IStorageGw;

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
  const categoryName = faker.commerce.department();
  const categoryIcon = faker.internet.emoji();
  const nonExistentOrgId = faker.string.uuid();

  const owner_id = ownerId;
  let org_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryUseCase,
        PrismaService,
        CategoryRepository,
        OrganizationRepo,
        {
          provide: ICATEGORY_CONTRACT,
          useClass: CategoryService,
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
          },
        },
      ],
    }).compile();

    createCategoryUseCase = module.get<CreateCategoryUseCase>(
      CreateCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<ICategoryContract>(ICATEGORY_CONTRACT);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);

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

    org_id = id;
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({});

    await prismaService.category.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(createCategoryUseCase).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should create a new category', async () => {
    // Arrange
    const data = {
      name: categoryName,
      icon: categoryIcon,
    };

    // Act
    const newCat = await createCategoryUseCase.execute({
      org_id,
      data,
    });

    // Assert
    expect(newCat).toBeInstanceOf(Category);
    expect(newCat.id).toBeDefined();
  });

  it('Should throw an error if the category already exists in the org', async () => {
    // Arrange
    const data = {
      name: categoryName,
      icon: categoryIcon,
    };

    // Assert
    await expect(
      createCategoryUseCase.execute({
        org_id,
        data,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('Should throw an error if the organization does not exists', async () => {
    // Arrange
    const data = {
      name: categoryName,
      icon: categoryIcon,
    };

    // Assert
    await expect(
      createCategoryUseCase.execute({
        org_id: nonExistentOrgId,
        data,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
