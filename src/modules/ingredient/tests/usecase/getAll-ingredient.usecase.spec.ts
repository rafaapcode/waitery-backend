import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { PrismaService } from 'src/infra/database/database.service';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { IngredientService } from '../../ingredient.service';
import { IngredientRepository } from '../../repo/ingredient.repository';
import { GetAllIngredientUseCase } from '../../usecases/GetAllIngredientUseCase';

describe('Create Ingredient UseCase', () => {
  let getAllIngredientUseCase: GetAllIngredientUseCase;
  let ingredientService: IIngredientContract;
  let ingredientRepo: IngredientRepository;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllIngredientUseCase,
        PrismaService,
        IngredientRepository,
        {
          provide: IINGREDIENT_CONTRACT,
          useClass: IngredientService,
        },
      ],
    }).compile();

    getAllIngredientUseCase = module.get<GetAllIngredientUseCase>(
      GetAllIngredientUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    ingredientService = module.get<IIngredientContract>(IINGREDIENT_CONTRACT);
    ingredientRepo = module.get<IngredientRepository>(IngredientRepository);

    await prismaService.ingredient.createMany({
      data: Array.from({ length: 6 }).map((_, idx) => ({
        icon: '🥗',
        name: `ing ${idx}`,
      })),
    });
  });

  it('Should all services be defined', () => {
    expect(getAllIngredientUseCase).toBeDefined();
    expect(ingredientService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(ingredientRepo).toBeDefined();
  });

  it('Should get all ingredients', async () => {
    // Act
    const ings = await getAllIngredientUseCase.execute();

    // Assert
    expect(ings.length).toBe(6);
    expect(ings[0]).toBeInstanceOf(Ingredient);
  });

  it('Should throw a NotFoundError if ingredients does not exists', async () => {
    // Arrange
    await prismaService.ingredient.deleteMany({
      where: {
        name: {
          in: Array.from({ length: 6 }).map((_, idx) => `ing ${idx}`),
        },
      },
    });

    // Assert
    await expect(getAllIngredientUseCase.execute()).rejects.toThrow(
      NotFoundException,
    );
  });
});
