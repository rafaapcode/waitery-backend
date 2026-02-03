import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';
import { IngredientRepository } from './repo/ingredient.repository';
import { CreateIngredientUseCase } from './usecases/CreateIngredientUseCase';
import { DeleteIngredientUseCase } from './usecases/DeleteIngredientUseCase';
import { GetAllIngredientUseCase } from './usecases/GetAllIngredientUseCase';
import { GetIngredientUseCase } from './usecases/GetIngredientUseCase';
import { UpdateIngredientUseCase } from './usecases/UpdateIngredientUseCase';

@Module({
  imports: [DatabaseModule],
  controllers: [IngredientController],
  providers: [
    IngredientRepository,
    IngredientService,
    CreateIngredientUseCase,
    UpdateIngredientUseCase,
    DeleteIngredientUseCase,
    GetIngredientUseCase,
    GetAllIngredientUseCase,
    {
      provide: IINGREDIENT_CONTRACT,
      useClass: IngredientService,
    },
  ],
  exports: [
    {
      provide: IINGREDIENT_CONTRACT,
      useClass: IngredientService,
    },
  ],
})
export class IngredientModule {}
