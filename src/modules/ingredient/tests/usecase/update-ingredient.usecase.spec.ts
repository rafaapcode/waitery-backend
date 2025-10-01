import { Test, TestingModule } from '@nestjs/testing';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
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
    ingredientService = module.get<IngredientService>(IINGREDIENT_CONTRACT);
    ingredientRepo = module.get<IngredientRepository>(IngredientRepository);
  });

  // afterAll(async () => {
  //   await prismaService.user.delete({
  //     where: {
  //       email: 'teste@gmail.com',
  //     },
  //   });
  // });

  it('Should all services be defined', () => {
    expect(updateIngredientUseCase).toBeDefined();
    expect(ingredientService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(ingredientRepo).toBeDefined();
  });
});
