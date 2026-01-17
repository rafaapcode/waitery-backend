import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
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
import { GetAllCategoryUseCase } from '../../usecases/GetAllCategoryUseCase';

describe('GetAll Categories UseCase', () => {
  let getAllCategoriesUseCase: GetAllCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let storageService: IStorageGw;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;

  const ownerId = faker.string.uuid();
  const org1Name = faker.company.name();
  const org2Name = faker.company.name();
  const orgEmail = faker.internet.email();
  const orgDescription = faker.lorem.paragraph();
  const cityName = faker.location.city();
  const locationCode =
    '-' +
    faker.location.state({ abbreviated: true }) +
    '-' +
    faker.string.numeric(3);
  const openHour = faker.number.int({ min: 6, max: 10 });
  const closeHour = faker.number.int({ min: 18, max: 23 });
  const categoryIcon = faker.internet.emoji();
  const baseCategoryName = faker.commerce.department();
  const nonExistentOrgId = faker.string.uuid();

  const owner_id = ownerId;
  let org_id: string;
  let org_id2: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllCategoryUseCase,
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

    getAllCategoriesUseCase = module.get<GetAllCategoryUseCase>(
      GetAllCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<ICategoryContract>(ICATEGORY_CONTRACT);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    orgService = module.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    storageService = module.get<IStorageGw>(ISTORAGE_SERVICE);

    const { id } = await prismaService.organization.create({
      data: {
        name: org1Name,
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

    const { id: org2_id } = await prismaService.organization.create({
      data: {
        name: org2Name,
        image_url: faker.image.url(),
        email: faker.internet.email(),
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
        owner_id,
      },
    });

    await prismaService.category.createMany({
      data: Array.from({ length: 20 }).map((_, idx) => ({
        icon: categoryIcon,
        name: `${baseCategoryName} ${idx}`,
        org_id: id,
      })),
    });

    org_id = id;
    org_id2 = org2_id;
  });

  afterAll(async () => {
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
    await prismaService.organization.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(getAllCategoriesUseCase).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should get all categories of a org', async () => {
    // Act
    const allCats = await getAllCategoriesUseCase.execute(org_id);

    // Assert
    expect(allCats.length).toBe(20);
    expect(allCats[0]).toBeInstanceOf(Category);
  });

  it('Should get an empty array if the org has not categories', async () => {
    // Act
    const allCats = await getAllCategoriesUseCase.execute(org_id2); // Assert
    expect(allCats.length).toBe(0);
    expect(allCats[0]).toBeUndefined();
    expect(allCats).toMatchObject([]);
  });
  it('hould throw a NotFoundException if the Org does', async () => {
    // Assert
    await expect(
      getAllCategoriesUseCase.execute(nonExistentOrgId),
    ).rejects.toThrow(NotFoundException);
  });
});
