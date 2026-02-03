import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ObservabilityModule } from 'src/infra/observability/observability.module';
import { StorageModule } from 'src/infra/storage/storage.module';
import { StorageService } from 'src/infra/storage/storage.service';
import {
  ICATEGORY_CONTRACT,
  IINGREDIENT_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
  ISTORAGE_SERVICE,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { UtilsService } from 'src/utils.service';
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
  imports: [DatabaseModule, StorageModule, ObservabilityModule],
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
    {
      provide: IUTILS_SERVICE,
      useClass: UtilsService,
    },
    {
      provide: ISTORAGE_SERVICE,
      useClass: StorageService,
    },
  ],
})
export class ProductModule {}
