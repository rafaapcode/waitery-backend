import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Organization } from 'generated/prisma';
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
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
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
  let factoriesService: FactoriesService;
  let org: Organization;
  let org2: Organization;

  const baseCategoryName = faker.commerce.department();
  const nonExistentOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
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
    factoriesService = module.get<FactoriesService>(FactoriesService);

    const { organization, owner } =
      await factoriesService.generateOrganizationWithOwner();

    org = organization;

    org2 = (await factoriesService.generateOrganizationWithOwner(owner.id))
      .organization;

    await factoriesService.generateManyCategories(20, org.id, baseCategoryName);
  });

  afterAll(async () => {
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(getAllCategoriesUseCase).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(org).toBeDefined();
    expect(org2).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should get all categories of a org', async () => {
    // Act
    const allCats = await getAllCategoriesUseCase.execute(org.id);

    // Assert
    expect(allCats.length).toBe(20);
    expect(allCats[0]).toBeInstanceOf(Category);
  });

  it('Should get an empty array if the org has not categories', async () => {
    // Act
    const allCats = await getAllCategoriesUseCase.execute(org2.id); // Assert
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
