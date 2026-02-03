import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ObservabilityModule } from 'src/infra/observability/observability.module';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';
import { OrganizationModule } from '../organization/organization.module';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './repo/category.repository';
import { CreateCategoryUseCase } from './usecases/CreateCategoryUseCase';
import { DeleteCategoryUseCase } from './usecases/DeleteCategoryUseCase';
import { GetAllCategoryUseCase } from './usecases/GetAllCategoryUseCase';
import { GetByIdCategoryUseCase } from './usecases/GetByIdCategoryUseCase';
import { UpdateCategoryUseCase } from './usecases/UpdateCategoryUseCase';

@Module({
  imports: [DatabaseModule, OrganizationModule, ObservabilityModule],
  controllers: [CategoryController],
  providers: [
    CategoryRepository,
    CreateCategoryUseCase,
    DeleteCategoryUseCase,
    UpdateCategoryUseCase,
    GetByIdCategoryUseCase,
    GetAllCategoryUseCase,
    {
      provide: ICATEGORY_CONTRACT,
      useClass: CategoryService,
    },
  ],
  exports: [
    {
      provide: ICATEGORY_CONTRACT,
      useClass: CategoryService,
    },
  ],
})
export class CategoryModule {}
