import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { PrismaService } from 'src/infra/database/database.service';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { IngredientService } from '../../ingredient.service';
import { IngredientRepository } from '../../repo/ingredient.repository';
import { UpdateIngredientUseCase } from '../../usecases/UpdateIngredientUseCase';

describe('Create Ingredient UseCase', () => {
  let updateIngredientUseCase: UpdateIngredientUseCase;
  let ingredientService: IIngredientContract;
  let ingredientRepo: IngredientRepository;
  let prismaService: PrismaService;
  let ing_id: string;

  const ingredientIcon = faker.internet.emoji();
  const ingredientName = faker.lorem.word().toLowerCase();
  const updatedIcon1 = faker.internet.emoji();
  const updatedIcon2 = faker.internet.emoji();
  const updatedIcon3 = faker.internet.emoji();
  const updatedName1 = faker.lorem.word();
  const updatedName2 = faker.lorem.word();
  const updatedName3 = faker.lorem.word();
  const fakeIngredientId = faker.string.uuid();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateIngredientUseCase,
        PrismaService,
        IngredientRepository,
        {
          provide: IINGREDIENT_CONTRACT,
          useClass: IngredientService,
        },
      ],
    }).compile();

    updateIngredientUseCase = module.get<UpdateIngredientUseCase>(
      UpdateIngredientUseCase,
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

  afterAll(async () => {
    await prismaService.ingredient.deleteMany({});
  });

  it('Should all services be defined', () => {
    expect(updateIngredientUseCase).toBeDefined();
    expect(ingredientService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(ingredientRepo).toBeDefined();
    expect(ing_id).toBeDefined();
  });

  it('Should update a ingredient', async () => {
    // Arrange
    const old_ing = await prismaService.ingredient.findUnique({
      where: { id: ing_id },
    });

    // Act
    const ing_updated = await updateIngredientUseCase.execute({
      id: ing_id,
      data: {
        icon: updatedIcon1,
        name: updatedName1,
      },
    });

    // Assert
    expect(ing_updated).toBeInstanceOf(Ingredient);
    expect(ing_updated.name).not.toBe(old_ing?.name);
    expect(ing_updated.icon).not.toBe(old_ing?.icon);
  });

  it('Should throw an NotFoundException if the ingredient not exists', async () => {
    // Assert
    await expect(
      updateIngredientUseCase.execute({
        id: fakeIngredientId,
        data: {
          icon: updatedIcon2,
          name: updatedName2,
        },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should normalize the ingredient name to lowerCase', async () => {
    // Arrange
    const old_ing = await prismaService.ingredient.findUnique({
      where: { id: ing_id },
    });
    jest.spyOn(ingredientService, 'update');

    // Act
    const ing_updated = await updateIngredientUseCase.execute({
      id: ing_id,
      data: {
        icon: updatedIcon3,
        name: updatedName3,
      },
    });

    // Assert
    expect(ing_updated).toBeInstanceOf(Ingredient);
    expect(ing_updated.name).not.toBe(old_ing?.name);
    expect(ingredientService.update).toHaveBeenCalledTimes(1);
    expect(ingredientService.update).toHaveBeenCalledWith({
      id: ing_id,
      ingredient: { icon: updatedIcon3, name: updatedName3.toLowerCase() },
    });
  });
});
