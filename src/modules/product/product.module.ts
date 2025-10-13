import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import {
  ICATEGORY_CONTRACT,
  IINGREDIENT_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';
import { CategoryService } from '../category/category.service';
import { IngredientService } from '../ingredient/ingredient.service';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './repo/product.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductController],
  providers: [
    ProductRepository,
    {
      provide: IPRODUCT_CONTRACT,
      useClass: ProductService,
    },
    {
      provide: ICATEGORY_CONTRACT,
      useClass: CategoryService,
    },
    {
      provide: IINGREDIENT_CONTRACT,
      useClass: IngredientService,
    },
  ],
})
export class ProductModule {}
