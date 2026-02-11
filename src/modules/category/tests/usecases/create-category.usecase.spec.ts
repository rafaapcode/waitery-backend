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
    OPEN_STREET_MAP_URL: 'https://nominatim_teste.openstreetmap.org/search',
  },
}));

import { faker } from '@faker-js/faker';
import { ConflictException, NotFoundException } from '@nestjs/common';
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
  let factorieService: FactoriesService;
  let org: Organization;

  const catName = faker.commerce.department();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
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
    factorieService = module.get<FactoriesService>(FactoriesService);

    org = (await factorieService.generateOrganizationWithOwner()).organization;
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(org).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(utilsService).toBeDefined();
    expect(storageService).toBeDefined();
  });

  it('Should create a new category', async () => {
    // Arrange
    const data = {
      name: catName,
      icon: faker.internet.emoji(),
    };

    // Act
    const newCat = await createCategoryUseCase.execute({
      org_id: org.id,
      data,
    });

    // Assert
    expect(newCat).toBeInstanceOf(Category);
    expect(newCat.id).toBeDefined();
  });

  it('Should throw an error if the category already exists in the org', async () => {
    // Arrange
    const data = {
      name: catName,
      icon: faker.internet.emoji(),
    };

    // Assert
    await expect(
      createCategoryUseCase.execute({
        org_id: org.id,
        data,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('Should throw an error if the organization does not exists', async () => {
    // Arrange
    const data = {
      name: faker.commerce.department(),
      icon: faker.internet.emoji(),
    };

    // Assert
    await expect(
      createCategoryUseCase.execute({
        org_id: faker.string.uuid(),
        data,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
