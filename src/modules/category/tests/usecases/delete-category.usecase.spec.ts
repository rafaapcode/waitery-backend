import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Category, Organization } from 'generated/prisma';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { PrismaService } from 'src/infra/database/database.service';
import { ICATEGORY_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';
import { DeleteCategoryUseCase } from '../../usecases/DeleteCategoryUseCase';

describe('Delete Category UseCase', () => {
  let deleteCategoryUseCAse: DeleteCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let utilsService: IUtilsContract;
  let prismaService: PrismaService;
  let org: Organization;
  let cat: Category;
  let factorieService: FactoriesService;

  const nonExistentCategoryId = faker.string.uuid();
  const wrongOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
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
    factorieService = module.get<FactoriesService>(FactoriesService);

    org = (await factorieService.generateOrganizationWithOwner()).organization;

    cat = await factorieService.generateCategoryInfo(org.id);

    await factorieService.generateProductInfo(org.id, cat.id);
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(deleteCategoryUseCAse).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(org).toBeDefined();
    expect(cat).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should throw an error if the category does not exists', async () => {
    //Assert
    await expect(
      deleteCategoryUseCAse.execute(nonExistentCategoryId, org.id),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the organization does not match', async () => {
    //Assert
    await expect(
      deleteCategoryUseCAse.execute(cat.id, wrongOrgId),
    ).rejects.toThrow(BadRequestException);
  });

  it('Should throw an error if the category is being used by a product', async () => {
    //Assert
    await expect(deleteCategoryUseCAse.execute(cat.id, org.id)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should delete a category', async () => {
    await prismaService.product.deleteMany({
      where: { org_id: org.id },
    });

    // Arrange
    const old_cat = await prismaService.category.findUnique({
      where: { id: cat.id },
    });

    // Act
    await deleteCategoryUseCAse.execute(cat.id, org.id);
    const actual_cat = await prismaService.category.findUnique({
      where: { id: cat.id },
    });

    //Assert
    expect(old_cat).toBeDefined();
    expect(actual_cat).toBeNull();
  });
});
