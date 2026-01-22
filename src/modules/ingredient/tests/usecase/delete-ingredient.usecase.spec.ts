import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Ingredient } from 'generated/prisma';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { PrismaService } from 'src/infra/database/database.service';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { FactoriesModule } from 'src/test/factories/factories.module';
import { FactoriesService } from 'src/test/factories/factories.service';
import { IngredientService } from '../../ingredient.service';
import { IngredientRepository } from '../../repo/ingredient.repository';
import { DeleteIngredientUseCase } from '../../usecases/DeleteIngredientUseCase';

describe('Delete Ingredient UseCase', () => {
  let deleteIngredientUseCase: DeleteIngredientUseCase;
  let ingredientService: IIngredientContract;
  let ingredientRepo: IngredientRepository;
  let prismaService: PrismaService;
  let factoriesService: FactoriesService;
  let ing: Ingredient;

  const nonExistentIngId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FactoriesModule],
      providers: [
        DeleteIngredientUseCase,
        PrismaService,
        IngredientRepository,
        {
          provide: IINGREDIENT_CONTRACT,
          useClass: IngredientService,
        },
      ],
    }).compile();

    deleteIngredientUseCase = module.get<DeleteIngredientUseCase>(
      DeleteIngredientUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    ingredientService = module.get<IIngredientContract>(IINGREDIENT_CONTRACT);
    ingredientRepo = module.get<IngredientRepository>(IngredientRepository);
    factoriesService = module.get<FactoriesService>(FactoriesService);

    ing = await factoriesService.generateAnIngredient();
  });

  it('Should all services be defined', () => {
    expect(deleteIngredientUseCase).toBeDefined();
    expect(ingredientService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(ingredientRepo).toBeDefined();
    expect(ing).toBeDefined();
  });

  it('Should delete a ingredient by id', async () => {
    // Arrange
    jest.spyOn(ingredientService, 'delete');

    // Act
    await deleteIngredientUseCase.execute(ing.id);

    const ingresult = await prismaService.ingredient.findUnique({
      where: { id: ing.id },
    });

    // Assert
    expect(ingresult).toBeNull();
    expect(ingredientService.delete).toHaveBeenCalledTimes(1);
    expect(ingredientService.delete).toHaveBeenCalledTimes(1);
  });

  it('Should throw a NotFoundError if the ingredient does not exists', async () => {
    // Assert
    await expect(
      deleteIngredientUseCase.execute(nonExistentIngId),
    ).rejects.toThrow(NotFoundException);
  });
});
