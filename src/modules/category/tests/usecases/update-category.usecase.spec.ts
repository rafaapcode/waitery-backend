import { faker } from '@faker-js/faker';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
import { UpdateCategoryUseCase } from '../../usecases/UpdateCategoryUseCase';

describe('Update Category UseCase', () => {
  let updateCategoryUseCase: UpdateCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let factoriesService: FactoriesService;
  let org: Organization;
  let cat: CatPrisma;

  const newIcon1 = faker.internet.emoji();
  const newName1 = faker.commerce.department();
  const newIcon2 = faker.internet.emoji();
  const newName2 = faker.commerce.department();
  const nonExistentCatId = faker.string.uuid();
  const wrongOrgId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
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
    factoriesService = module.get<FactoriesService>(FactoriesService);

    org = (await factoriesService.generateOrganizationWithOwner()).organization;
  });

  beforeEach(async () => {
    // Criar uma nova categoria para cada teste
    cat = await factoriesService.generateCategoryInfo(org.id);
  });

  afterEach(async () => {
    await prismaService.category.deleteMany({});
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
    expect(org).toBeDefined();
    expect(cat).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should update ONLY THE ICON of a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat.id,
      category: {
        icon: newIcon1,
      },
    };
    const old_cat = await prismaService.category.findUnique({
      where: { id: cat.id },
    });

    // Act
    const updated_cat = await updateCategoryUseCase.execute(
      data.id,
      org.id,
      data.category,
    );

    // Assert
    expect(updated_cat).toBeInstanceOf(Category);
    expect(updated_cat.id).toBe(cat.id);
    expect(updated_cat.org_id).toBe(org.id);
    expect(updated_cat.icon).not.toBe(old_cat?.icon);
  });

  it('Should update ONLY THE NAME of a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat.id,
      category: {
        name: newName1,
      },
    };
    const old_cat = await prismaService.category.findUnique({
      where: { id: cat.id },
    });

    // Act
    const updated_cat = await updateCategoryUseCase.execute(
      data.id,
      org.id,
      data.category,
    );

    // Assert
    expect(updated_cat).toBeInstanceOf(Category);
    expect(updated_cat.id).toBe(cat.id);
    expect(updated_cat.org_id).toBe(org.id);
    expect(updated_cat.name).not.toBe(old_cat?.name);
  });

  it('Should update THE BOTH FIELDS of a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat.id,
      category: {
        name: newName2,
        icon: newIcon2,
      },
    };
    const old_cat = await prismaService.category.findUnique({
      where: { id: cat.id },
    });

    // Act
    const updated_cat = await updateCategoryUseCase.execute(
      data.id,
      org.id,
      data.category,
    );

    // Assert
    expect(updated_cat).toBeInstanceOf(Category);
    expect(updated_cat.id).toBe(cat.id);
    expect(updated_cat.org_id).toBe(org.id);
    expect(updated_cat.name).not.toBe(old_cat?.name);
    expect(updated_cat.icon).not.toBe(old_cat?.icon);
  });

  it('Should throw a NotFoundException if the category does not exist', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat.id,
      category: {
        name: newName2,
        icon: newIcon2,
      },
    };

    // Assert
    await expect(
      updateCategoryUseCase.execute(nonExistentCatId, org.id, data.category),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw a BadRequestException if the organization does not match', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat.id,
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
