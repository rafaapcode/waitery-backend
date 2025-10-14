import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import {
  ICATEGORY_CONTRACT,
  IINGREDIENT_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';
import { CategoryService } from '../category/category.service';
import { CategoryRepository } from '../category/repo/category.repository';
import { IngredientService } from '../ingredient/ingredient.service';
import { IngredientRepository } from '../ingredient/repo/ingredient.repository';
import { OrganizationService } from '../organization/organization.service';
import { OrganizationRepo } from '../organization/repo/organization.repo';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './repo/product.repository';
import { CreateProductUseCase } from './usecases/CreateProductUseCase';
import { DeleteProductUseCase } from './usecases/DeleteProductUseCase';
import { GetAllProductUseCase } from './usecases/GetAllProductsUseCase';
import { GetProductByCategoryUseCase } from './usecases/GetProductByCategoryUseCase';
import { GetProductUseCase } from './usecases/GetProductUseCase';
import { UpdateProductUseCase } from './usecases/UpdateProductUseCase';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductController],
  providers: [
    ProductRepository,
    CategoryRepository,
    IngredientRepository,
    OrganizationRepo,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    GetAllProductUseCase,
    GetProductByCategoryUseCase,
    GetProductUseCase,
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
    {
      provide: IORGANIZATION_CONTRACT,
      useClass: OrganizationService,
    },
  ],
})
export class ProductModule {}
