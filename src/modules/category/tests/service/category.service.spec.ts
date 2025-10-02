import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category } from 'src/core/domain/entities/category';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';

describe('Category Service', () => {
  let categoryService: CategoryService;
  let categoryRepo: CategoryRepository;

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
          },
        },
      ],
    }).compile();

    categoryService = module.get<CategoryService>(CategoryService);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
  });

  beforeEach(() => jest.clearAllMocks());

  it('Shoudl be all sevices defined', () => {
    expect(categoryService).toBeDefined();
    expect(categoryRepo).toBeDefined();
  });

  it('Should create a new category', async () => {
    // Arrange
    const data: ICategoryContract.CreateParams = {
      icon: '🍕',
      name: 'Massas',
      org_id: 'org_id12312313',
    };
    jest.spyOn(categoryRepo, 'create').mockResolvedValue({
      icon: '🍕',
      name: 'Massas',
      org_id: 'org_id12312313',
      id: 'haoda183131',
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
    await categoryService.delete('category_id');

    // Assert
    expect(categoryRepo.delete).toHaveBeenCalledTimes(1);
    expect(categoryRepo.delete).toHaveBeenCalledWith('category_id');
  });

  it('Should update a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: 'id_category',
      category: {
        icon: '🍕',
        name: 'Massas2',
      },
    };
    jest.spyOn(categoryRepo, 'update').mockResolvedValue({
      icon: '🍕',
      name: 'Massas2',
      org_id: 'org_id12312313',
      id: 'id_category',
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
      icon: '🍕',
      name: 'Massas',
      org_id: 'org_id12312313',
      id: 'id_category',
    });

    // Act
    const cat = await categoryService.getCategory('cat_id');

    // Assert
    expect(cat).toBeInstanceOf(Category);
    expect(categoryRepo.getById).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getById).toHaveBeenCalledWith('cat_id');
  });

  it('Should return null if category does not exist', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getById').mockResolvedValue(null);

    // Act
    const cat = await categoryService.getCategory('cat_id');

    // Assert
    expect(cat).toBeNull();
    expect(categoryRepo.getById).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getById).toHaveBeenCalledWith('cat_id');
  });

  it('Should get all categories', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getAllCategories').mockResolvedValue(
      Array.from({ length: 3 }).map((_, idx) => ({
        icon: '🍕',
        name: `Massas ${idx}`,
        org_id: `org_id_${idx}`,
        id: `id_category_${idx}`,
      })),
    );

    // Act
    const cat = await categoryService.getAllCategories('org_id');

    // Assert
    expect(cat.length).toBe(3);
    expect(cat[0]).toBeInstanceOf(Category);
    expect(categoryRepo.getAllCategories).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getAllCategories).toHaveBeenCalledWith('org_id');
  });

  it('Should return an empty array if 0 cat is found', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getAllCategories').mockResolvedValue([]);

    // Act
    const cat = await categoryService.getAllCategories('org_id');

    // Assert
    expect(cat.length).toBe(0);
    expect(cat[0]).toBeUndefined();
    expect(categoryRepo.getAllCategories).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getAllCategories).toHaveBeenCalledWith('org_id');
  });

  it('Should get a category by name', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getByName').mockResolvedValue({
      icon: '🍕',
      name: 'Massas',
      org_id: 'org_id12312313',
      id: 'id_category',
    });

    // Act
    const cat = await categoryService.getCategoryByName('Massas');

    // Assert
    expect(cat).toBeInstanceOf(Category);
    expect(categoryRepo.getByName).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getByName).toHaveBeenCalledWith('Massas');
  });

  it('Should return null if category does not exits, filtering by name', async () => {
    // Arrange
    jest.spyOn(categoryRepo, 'getByName').mockResolvedValue(null);

    // Act
    const cat = await categoryService.getCategoryByName('Massas');

    // Assert
    expect(cat).toBeNull();
    expect(categoryRepo.getByName).toHaveBeenCalledTimes(1);
    expect(categoryRepo.getByName).toHaveBeenCalledWith('Massas');
  });
});
