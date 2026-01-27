import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import {
  Category,
  createCategoryEntity,
} from 'src/core/domain/entities/category';
import { IUTILS_SERVICE } from 'src/shared/constants';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';

describe('Category Service', () => {
  let categoryService: CategoryService;
  let categoryRepo: CategoryRepository;
  let utilsService: IUtilsContract;

  const categoryIcon = faker.internet.emoji();
  const categoryName = faker.commerce.department();
  const updatedCategoryName = faker.commerce.department();
  const orgId = faker.string.uuid();
  const categoryId = faker.string.uuid();
  const catId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getByName: jest.fn(),
            getById: jest.fn(),
            getAllCategories: jest.fn(),
            isBeingUsed: jest.fn(),
          },
        },
        {
          provide: IUTILS_SERVICE,
          useValue: {
            verifyCepService: jest.fn(),
          },
        },
      ],
    }).compile();

    categoryService = module.get<CategoryService>(CategoryService);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    utilsService = module.get<IUtilsContract>(IUTILS_SERVICE);
  });

  beforeEach(() => jest.clearAllMocks());

  it('Shoudl be all sevices defined', () => {
    expect(categoryService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should create a new category', async () => {
    // Arrange
    const data: ICategoryContract.CreateParams = createCategoryEntity({
      icon: categoryIcon,
      name: categoryName,
      org_id: orgId,
    });
    jest.spyOn(categoryRepo, 'create').mockResolvedValue({
      icon: categoryIcon,
      name: categoryName,
      org_id: orgId,
      id: categoryId,
    });

    // Act
    const cat = await categoryService.create(data);

    // Assert
    expect(cat).toBeInstanceOf(Category);
    expect(categoryRepo.create).toHaveBeenCalledTimes(1);
    expect(categoryRepo.create).toHaveBeenCalledWith(data);
  });

  it('Should delete a category', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'delete').mockResolvedValue();

    // Act
    await categoryService.delete(categoryId);

    // Assert
    expect(categoryRepo.delete).toHaveBeenCalledTimes(1);
    expect(categoryRepo.delete).toHaveBeenCalledWith(categoryId);
  });

  it('Should update a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: categoryId,
      category: {
        icon: categoryIcon,
        name: updatedCategoryName,
      },
    };
    jest.spyOn(categoryRepo, 'update').mockResolvedValue({
      icon: categoryIcon,
      name: updatedCategoryName,
      org_id: orgId,
      id: categoryId,
    });

    // Act
    const cat = await categoryService.update(data);

    // Assert
    expect(cat).toBeInstanceOf(Category);
    expect(categoryRepo.update).toHaveBeenCalledTimes(1);
    expect(categoryRepo.update).toHaveBeenCalledWith(data);
  });

  it('Should get a category', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getById').mockResolvedValue({
      icon: categoryIcon,
      name: categoryName,
      org_id: orgId,
      id: categoryId,
    });

    // Act
    const cat = await categoryService.getCategory({ id: catId, orgId: orgId });

    // Assert
    expect(cat).toBeInstanceOf(Category);
    expect(categoryRepo.getById).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getById).toHaveBeenCalledWith({
      id: catId,
      orgId: orgId,
    });
  });

  it('Should return null if category does not exist', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getById').mockResolvedValue(null);

    // Act
    const cat = await categoryService.getCategory({ id: catId, orgId: orgId });

    // Assert
    expect(cat).toBeNull();
    expect(categoryRepo.getById).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getById).toHaveBeenCalledWith({
      id: catId,
      orgId: orgId,
    });
  });

  it('Should get all categories', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getAllCategories').mockResolvedValue(
      Array.from({ length: 3 }).map((_, idx) => ({
        icon: categoryIcon,
        name: `${categoryName} ${idx}`,
        org_id: `${orgId}_${idx}`,
        id: `${categoryId}_${idx}`,
      })),
    );

    // Act
    const cat = await categoryService.getAllCategories(orgId);

    // Assert
    expect(cat.length).toBe(3);
    expect(cat[0]).toBeInstanceOf(Category);
    expect(categoryRepo.getAllCategories).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getAllCategories).toHaveBeenCalledWith(orgId);
  });

  it('Should return an empty array if 0 cat is found', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getAllCategories').mockResolvedValue([]);

    // Act
    const cat = await categoryService.getAllCategories(orgId);

    // Assert
    expect(cat.length).toBe(0);
    expect(cat[0]).toBeUndefined();
    expect(categoryRepo.getAllCategories).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getAllCategories).toHaveBeenCalledWith(orgId);
  });

  it('Should get a category by name', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getByName').mockResolvedValue({
      icon: categoryIcon,
      name: categoryName,
      org_id: orgId,
      id: categoryId,
    });

    // Act
    const cat = await categoryService.getCategoryByName({
      name: categoryName,
      org_id: orgId,
    });

    // Assert
    expect(cat).toBeInstanceOf(Category);
    expect(categoryRepo.getByName).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getByName).toHaveBeenCalledWith({
      name: categoryName,
      org_id: orgId,
    });
  });

  it('Should return null if category does not exits, filtering by name', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getByName').mockResolvedValue(null);

    // Act
    const cat = await categoryService.getCategoryByName({
      name: categoryName,
      org_id: orgId,
    });

    // Assert
    expect(cat).toBeNull();
    expect(categoryRepo.getByName).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getByName).toHaveBeenCalledWith({
      name: categoryName,
      org_id: orgId,
    });
  });

  it('Should return true if category is being used', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'isBeingUsed').mockResolvedValue(true);

    // Act
    const cat = await categoryService.isBeingUsed({
      cat_id: catId,
      org_id: orgId,
    });

    // Assert
    expect(cat).toBeTruthy();
    expect(categoryRepo.isBeingUsed).toHaveBeenCalledTimes(1);
    expect(categoryRepo.isBeingUsed).toHaveBeenCalledWith({
      cat_id: catId,
      org_id: orgId,
    });
  });

  // Create the falsy scenario
  it('Should return false if category is not being used', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'isBeingUsed').mockResolvedValue(false);

    // Act
    const cat = await categoryService.isBeingUsed({
      cat_id: catId,
      org_id: orgId,
    });

    // Assert
    expect(cat).toBeFalsy();
    expect(categoryRepo.isBeingUsed).toHaveBeenCalledTimes(1);
    expect(categoryRepo.isBeingUsed).toHaveBeenCalledWith({
      cat_id: catId,
      org_id: orgId,
    });
  });
});
