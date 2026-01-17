import { faker } from '@faker-js/faker';
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

  const ingredientIcon = faker.internet.emoji();
  const ingredientName1 = faker.lorem.word();
  const ingredientName2 = faker.lorem.word();
  const ingredientId1 = faker.string.uuid();
  const ingredientId2 = faker.string.uuid();
  const baseIngredientName = faker.lorem.word();

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
      icon: ingredientIcon,
      name: ingredientName1,
    });
    jest.spyOn(ingredientRepo, 'create').mockResolvedValue({
      icon: ingredientIcon,
      name: ingredientName1,
      id: ingredientId1,
    });

    // Act
    const ingredient = await ingredientService.create(data);

    // Assert
    expect(ingredient).toBeDefined();
    expect(ingredient).toBeInstanceOf(Ingredient);
    expect(ingredient.name).toBe(ingredientName1);
    expect(ingredient.icon).toBe(ingredientIcon);
    expect(ingredientRepo.create).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.create).toHaveBeenCalledWith({
      icon: ingredientIcon,
      name: ingredientName1,
    });
  });

  it('Should update a ingredient', async () => {
    // Arrange
    const data: IIngredientContract.UpdateParams = {
      id: ingredientId2,
      ingredient: {
        icon: ingredientIcon,
        name: ingredientName2,
      },
    };
    jest.spyOn(ingredientRepo, 'update').mockResolvedValue({
      icon: ingredientIcon,
      name: ingredientName2,
      id: ingredientId2,
    });

    // Act
    const ingredient = await ingredientService.update(data);

    // Assert
    expect(ingredient).toBeDefined();
    expect(ingredient).toBeInstanceOf(Ingredient);
    expect(ingredient.name).toBe(ingredientName2);
    expect(ingredient.icon).toBe(ingredientIcon);
    expect(ingredient.id).toBe(ingredientId2);
    expect(ingredientRepo.update).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.update).toHaveBeenCalledWith({
      id: ingredientId2,
      ingredient: {
        icon: ingredientIcon,
        name: ingredientName2,
      },
    });
  });

  it('Should delete a ingredient', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'delete').mockResolvedValue();

    // Act
    await ingredientService.delete(ingredientId2);

    // Assert
    expect(ingredientRepo.delete).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.delete).toHaveBeenCalledWith(ingredientId2);
  });

  it('Should return an ingredient entity', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getById').mockResolvedValue({
      icon: ingredientIcon,
      name: ingredientName1,
      id: ingredientId1,
    });

    // Act
    const ing = await ingredientService.get(ingredientId2);

    // Assert
    expect(ing).toBeInstanceOf(Ingredient);
    expect(ing).toEqual({
      icon: ingredientIcon,
      name: ingredientName1,
      id: ingredientId1,
    });
    expect(ingredientRepo.getById).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.getById).toHaveBeenCalledWith(ingredientId2);
  });

  it('Should return null if the ingredient not exists', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getById').mockResolvedValue(null);

    // Act
    const ing = await ingredientService.get(ingredientId2);

    // Assert
    expect(ing).toBeNull();
    expect(ingredientRepo.getById).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.getById).toHaveBeenCalledWith(ingredientId2);
  });

  it('Should return an ingredient entity array', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getAll').mockResolvedValue(
      Array.from({ length: 4 }).map((_, idx) => ({
        icon: ingredientIcon,
        name: `${baseIngredientName} ${idx}`,
        id: `${ingredientId1}${idx}`,
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
      icon: ingredientIcon,
      name: ingredientName1,
      id: ingredientId1,
    });

    // Act
    const ing = await ingredientService.getByName(ingredientName1);

    // Assert
    expect(ing).toBeInstanceOf(Ingredient);
    expect(ing).toEqual({
      icon: ingredientIcon,
      name: ingredientName1,
      id: ingredientId1,
    });
    expect(ingredientRepo.getByName).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.getByName).toHaveBeenCalledWith(ingredientName1);
  });

  it('Should return null if the ingredient not exists filtering by the name', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getByName').mockResolvedValue(null);

    // Act
    const ing = await ingredientService.getByName(ingredientName2);

    // Assert
    expect(ing).toBeNull();
    expect(ingredientRepo.getByName).toHaveBeenCalledTimes(1);
    expect(ingredientRepo.getByName).toHaveBeenCalledWith(ingredientName2);
  });
  it('Should return an ingredient entity array filtering by ids', async () => {
    // Arrange
    jest.spyOn(ingredientRepo, 'getAllIngsByIds').mockResolvedValue(
      Array.from({ length: 4 }).map((_, idx) => ({
        icon: ingredientIcon,
        name: `${baseIngredientName} ${idx}`,
        id: `${ingredientId1}${idx}`,
      })),
    );
    const data = [
      `${ingredientId1}1`,
      `${ingredientId1}2`,
      `${ingredientId1}3`,
      `${ingredientId1}4`,
    ];

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
