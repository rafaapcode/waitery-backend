import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Category as CatPrisma, Organization } from 'generated/prisma';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { Category } from 'src/core/domain/entities/category';
import { PrismaService } from 'src/infra/database/database.service';
import { ICATEGORY_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';
import { GetByIdCategoryUseCase } from '../../usecases/GetByIdCategoryUseCase';

describe('Get Category by Id UseCase', () => {
  let getByIdCategoryUseCase: GetByIdCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let factoriesService: FactoriesService;
  let cat: CatPrisma;
  let org: Organization;

  const nonExistentCatId = faker.string.uuid();
  const wrongOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        GetByIdCategoryUseCase,
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

    getByIdCategoryUseCase = module.get<GetByIdCategoryUseCase>(
      GetByIdCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<ICategoryContract>(ICATEGORY_CONTRACT);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    org = (await factoriesService.generateOrganizationWithOwner()).organization;
    cat = await factoriesService.generateCategoryInfo(org.id);
  });

  afterAll(async () => {
    await prismaService.category.deleteMany({});
    await prismaService.organization.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(getByIdCategoryUseCase).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(org).toBeDefined();
    expect(cat).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should get the category by id', async () => {
    // Act
    const category_returned = await getByIdCategoryUseCase.execute(
      cat.id,
      org.id,
    );

    // Assert
    expect(category_returned).toBeInstanceOf(Category);
    expect(category_returned.id).toBeDefined();
    expect(category_returned.org_id).toBeDefined();
  });

  it('Should throw an NotFoundException if the category does not exists', async () => {
    // Assert
    await expect(
      getByIdCategoryUseCase.execute(nonExistentCatId, org.id),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an NotFoundException if the org does not match', async () => {
    // Assert
    await expect(
      getByIdCategoryUseCase.execute(cat.id, wrongOrgId),
    ).rejects.toThrow(NotFoundException);
  });
});
