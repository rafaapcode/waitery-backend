import { Test, TestingModule } from '@nestjs/testing';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import {
  createIngredientEntity,
  Ingredient,
} from 'src/core/domain/entities/ingredient';
import { IngredientService } from '../../ingredient.service';
import { IngredientRepository } from '../../repo/ingredient.repository';

describe('Ingredient Service', () => {
  let ingredientService: IngredientService;
  let ingredientRepo: IngredientRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientService,
        {
          provide: IngredientRepository,
          useValue: {
            create: jest.fn(),
            getAll: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getByName: jest.fn(),
            getAllIngsByIds: jest.fn(),
          },
        },
      ],
    }).compile();

    ingredientService = module.get<IngredientService>(IngredientService);
    ingredientRepo = module.get<IngredientRepository>(IngredientRepository);
  });

  beforeEach(() => jest.clearAllMocks());

  it('Should be all services defined', () => {
    expect(ingredientService).toBeDefined();
    expect(ingredientRepo).toBeDefined();
  });

  it('Should create a new ingredient', async () => {
    // Arrange
    const data: IIngredientContract.CreateParams = createIngredientEntity({
      icon: '🍪',
      name: 'Ing 1',
    });
    jest.spyOn(ingredientRepo, 'create').mockResolvedValue({
      icon: '🍪',
      name: 'Ing 1',
      id: 'id123123',
    });

    // Act
    const ingredient = await ingredientService.create(data);

    // Assert
    expect(ingredient).toBeDefined();
    expect(ingredient).toBeInstanceOf(Ingredient);
    expect(ingredient.name).toBe('Ing 1');
    expect(ingredient.icon).toBe('🍪');
    expect(ingredientRepo.create).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.create).toHaveBeenCalledWith({
      icon: '🍪',
      name: 'Ing 1',
    });
  });

  it('Should update a ingredient', async () => {
    // Arrange
    const data: IIngredientContract.UpdateParams = {
      id: '12312313',
      ingredient: {
        icon: '🍪',
        name: 'Ing 2',
      },
    };
    jest.spyOn(ingredientRepo, 'update').mockResolvedValue({
      icon: '🍪',
      name: 'Ing 2',
      id: '12312313',
    });

    // Act
    const ingredient = await ingredientService.update(data);

    // Assert
    expect(ingredient).toBeDefined();
    expect(ingredient).toBeInstanceOf(Ingredient);
    expect(ingredient.name).toBe('Ing 2');
    expect(ingredient.icon).toBe('🍪');
    expect(ingredient.id).toBe('12312313');
    expect(ingredientRepo.update).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.update).toHaveBeenCalledWith({
      id: '12312313',
      ingredient: {
        icon: '🍪',
        name: 'Ing 2',
      },
    });
  });

  it('Should delete a ingredient', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'delete').mockResolvedValue();

    // Act
    await ingredientService.delete('12312313');

    // Assert
    expect(ingredientRepo.delete).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.delete).toHaveBeenCalledWith('12312313');
  });

  it('Should return an ingredient entity', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getById').mockResolvedValue({
      icon: '🍪',
      name: 'Ing 1',
      id: '123131131',
    });

    // Act
    const ing = await ingredientService.get('12312313');

    // Assert
    expect(ing).toBeInstanceOf(Ingredient);
    expect(ing).toEqual({
      icon: '🍪',
      name: 'Ing 1',
      id: '123131131',
    });
    expect(ingredientRepo.getById).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.getById).toHaveBeenCalledWith('12312313');
  });

  it('Should return null if the ingredient not exists', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getById').mockResolvedValue(null);

    // Act
    const ing = await ingredientService.get('12312313');

    // Assert
    expect(ing).toBeNull();
    expect(ingredientRepo.getById).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.getById).toHaveBeenCalledWith('12312313');
  });

  it('Should return an ingredient entity array', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getAll').mockResolvedValue(
      Array.from({ length: 4 }).map((_, idx) => ({
        icon: '🍪',
        name: `Ing ${idx}`,
        id: `123131131${idx}`,
      })),
    );

    // Act
    const ing = await ingredientService.getAll();

    // Assert
    expect(ing[0]).toBeInstanceOf(Ingredient);
    expect(ing[0].id).toBeDefined();
    expect(ing?.length).toBe(4);
    expect(ingredientRepo.getAll).toHaveBeenCalledTimes(1);
  });

  it('Should return an empty array', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getAll').mockResolvedValue([]);

    // Act
    const ing = await ingredientService.getAll();

    // Assert
    expect(ing[0]).toBeUndefined();
    expect(ing.length).toBe(0);
    expect(ingredientRepo.getAll).toHaveBeenCalledTimes(1);
  });

  it('Should return an ingredient entity getting by the name', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getByName').mockResolvedValue({
      icon: '🍪',
      name: 'Ing 1',
      id: '123131131',
    });

    // Act
    const ing = await ingredientService.getByName('Ing 1');

    // Assert
    expect(ing).toBeInstanceOf(Ingredient);
    expect(ing).toEqual({
      icon: '🍪',
      name: 'Ing 1',
      id: '123131131',
    });
    expect(ingredientRepo.getByName).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.getByName).toHaveBeenCalledWith('Ing 1');
  });

  it('Should return null if the ingredient not exists filtering by the name', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getByName').mockResolvedValue(null);

    // Act
    const ing = await ingredientService.getByName('Ing 2');

    // Assert
    expect(ing).toBeNull();
    expect(ingredientRepo.getByName).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.getByName).toHaveBeenCalledWith('Ing 2');
  });
  it('Should return an ingredient entity array filtering by ids', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getAllIngsByIds').mockResolvedValue(
      Array.from({ length: 4 }).map((_, idx) => ({
        icon: '🍪',
        name: `Ing ${idx}`,
        id: `123131131${idx}`,
      })),
    );
    const data = ['1231311311', '1231311312', '1231311313', '1231311314'];

    // Act
    const ing = await ingredientService.getByManyByIds(data);

    // Assert
    expect(ing[0]).toBeInstanceOf(Ingredient);
    expect(ing[0].id).toBeDefined();
    expect(ing?.length).toBe(4);
    expect(ingredientRepo.getAllIngsByIds).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.getAllIngsByIds).toHaveBeenCalledWith(data);
  });
});
