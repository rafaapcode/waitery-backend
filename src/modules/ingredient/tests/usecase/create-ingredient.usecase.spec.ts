import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { PrismaService } from 'src/infra/database/database.service';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { IngredientService } from '../../ingredient.service';
import { IngredientRepository } from '../../repo/ingredient.repository';
import { CreateIngredientUseCase } from '../../usecases/CreateIngredientUseCase';

describe('Create Ingredient UseCase', () => {
  let createIngredientUseCase: CreateIngredientUseCase;
  let ingredientService: IIngredientContract;
  let ingredientRepo: IngredientRepository;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateIngredientUseCase,
        PrismaService,
        IngredientRepository,
        {
          provide: IINGREDIENT_CONTRACT,
          useClass: IngredientService,
        },
      ],
    }).compile();

    createIngredientUseCase = module.get<CreateIngredientUseCase>(
      CreateIngredientUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    ingredientService = module.get<IngredientService>(IINGREDIENT_CONTRACT);
    ingredientRepo = module.get<IngredientRepository>(IngredientRepository);
  });

  afterAll(async () => {
    await prismaService.ingredient.delete({
      where: {
        name: 'ing 1',
      },
    });

    await prismaService.ingredient.delete({
      where: {
        name: 'ing 2',
      },
    });
  });

  it('Should all services be defined', () => {
    expect(createIngredientUseCase).toBeDefined();
    expect(ingredientService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(ingredientRepo).toBeDefined();
  });

  it('Should create a new ingredient', async () => {
    // Arrage
    const data: IIngredientContract.CreateParams = {
      icon: '🥗',
      name: 'Ing 1',
    };

    // Act
    const ing = await createIngredientUseCase.execute(data);

    // Assert
    expect(ing).toBeInstanceOf(Ingredient);
    expect(ing.id).toBeDefined();
  });

  it('Should throw a Conflict error if the ingredient already exists', async () => {
    // Arrage
    const data: IIngredientContract.CreateParams = {
      icon: '🥗',
      name: 'Ing 1',
    };

    // Assert
    await expect(createIngredientUseCase.execute(data)).rejects.toThrow(
      ConflictException,
    );
  });

  it('Should normalize the name to lowercase when create a new ingredient', async () => {
    // Arrage
    const data: IIngredientContract.CreateParams = {
      icon: '🥗',
      name: 'Ing 2',
    };
    jest.spyOn(ingredientService, 'create');
    jest.spyOn(ingredientService, 'getByName');

    // Act
    const ing = await createIngredientUseCase.execute(data);

    // Assert
    expect(ing).toBeInstanceOf(Ingredient);
    expect(ing.id).toBeDefined();
    expect(ingredientService.create).toHaveBeenCalledTimes(1);
    expect(ingredientService.getByName).toHaveBeenCalledTimes(1);
    expect(ingredientService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ing 2',
      }),
    );
    expect(ingredientService.getByName).toHaveBeenCalledWith('ing 2');
  });
});
