import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';

@Module({
  imports: [DatabaseModule],
  controllers: [IngredientController],
  providers: [IngredientService],
})
export class IngredientModule {}
