import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';
import { OrganizationModule } from '../organization/organization.module';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './repo/category.repository';
import { CreateCategoryUseCase } from './usecases/CreateCategoryUseCase';
import { DeleteCategoryUseCase } from './usecases/DeleteCategoryUseCase';

@Module({
  imports: [DatabaseModule, OrganizationModule],
  controllers: [CategoryController],
  providers: [
    CategoryRepository,
    CreateCategoryUseCase,
    DeleteCategoryUseCase,
    {
      provide: ICATEGORY_CONTRACT,
      useClass: CategoryService,
    },
  ],
})
export class CategoryModule {}
