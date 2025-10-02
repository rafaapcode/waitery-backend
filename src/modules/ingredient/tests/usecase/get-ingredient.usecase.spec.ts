import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { PrismaService } from 'src/infra/database/database.service';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { IngredientService } from '../../ingredient.service';
import { IngredientRepository } from '../../repo/ingredient.repository';
import { GetIngredientUseCase } from '../../usecases/GetIngredientUseCase';

describe('Get Ingredient UseCase', () => {
  let getIngredientUseCase: GetIngredientUseCase;
  let ingredientService: IIngredientContract;
  let ingredientRepo: IngredientRepository;
  let prismaService: PrismaService;
  let ing_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetIngredientUseCase,
        PrismaService,
        IngredientRepository,
        {
          provide: IINGREDIENT_CONTRACT,
          useClass: IngredientService,
        },
      ],
    }).compile();

    getIngredientUseCase =
      module.get<GetIngredientUseCase>(GetIngredientUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    ingredientService = module.get<IngredientService>(IINGREDIENT_CONTRACT);
    ingredientRepo = module.get<IngredientRepository>(IngredientRepository);

    const { id } = await prismaService.ingredient.create({
      data: {
        icon: '🥗',
        name: 'ing 1',
      },
    });
    ing_id = id;
  });

  afterAll(async () => {
    await prismaService.ingredient.delete({
      where: {
        name: 'ing 1',
      },
    });
  });

  it('Should all services be defined', () => {
    expect(getIngredientUseCase).toBeDefined();
    expect(ingredientService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(ingredientRepo).toBeDefined();
    expect(ing_id).toBeDefined();
  });

  it('Should get the ingredient by Id', async () => {
    // Act
    const ing = await getIngredientUseCase.execute(ing_id);

    // Assert
    expect(ing).toBeInstanceOf(Ingredient);
    expect(ing.id).toBeDefined();
  });

  it('Should throw NotFoundException if the ingredient not exists', async () => {
    // Assert
    await expect(getIngredientUseCase.execute('ing_id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
