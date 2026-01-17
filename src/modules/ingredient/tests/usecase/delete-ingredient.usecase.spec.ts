import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { PrismaService } from 'src/infra/database/database.service';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { IngredientService } from '../../ingredient.service';
import { IngredientRepository } from '../../repo/ingredient.repository';
import { DeleteIngredientUseCase } from '../../usecases/DeleteIngredientUseCase';

describe('Delete Ingredient UseCase', () => {
  let deleteIngredientUseCase: DeleteIngredientUseCase;
  let ingredientService: IIngredientContract;
  let ingredientRepo: IngredientRepository;
  let prismaService: PrismaService;
  let ing_id: string;

  const ingredientIcon = faker.internet.emoji();
  const ingredientName = faker.lorem.word().toLowerCase();
  const nonExistentIngId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    const { id } = await prismaService.ingredient.create({
      data: {
        icon: ingredientIcon,
        name: ingredientName,
      },
    });
    ing_id = id;
  });

  it('Should all services be defined', () => {
    expect(deleteIngredientUseCase).toBeDefined();
    expect(ingredientService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(ingredientRepo).toBeDefined();
    expect(ing_id).toBeDefined();
  });

  it('Should delete a ingredient by id', async () => {
    // Arrange
    jest.spyOn(ingredientService, 'delete');

    // Act
    await deleteIngredientUseCase.execute(ing_id);

    const ing = await prismaService.ingredient.findUnique({
      where: { id: ing_id },
    });

    // Assert
    expect(ing).toBeNull();
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
