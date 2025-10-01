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
    ingredientService = module.get<IngredientService>(IINGREDIENT_CONTRACT);
    ingredientRepo = module.get<IngredientRepository>(IngredientRepository);
  });

  it('Should all services be defined', () => {
    expect(deleteIngredientUseCase).toBeDefined();
    expect(ingredientService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(ingredientRepo).toBeDefined();
  });
});
