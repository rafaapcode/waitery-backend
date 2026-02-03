import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ObservabilityModule } from 'src/infra/observability/observability.module';
import { StorageModule } from 'src/infra/storage/storage.module';
import { StorageService } from 'src/infra/storage/storage.service';
import {
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { UtilsService } from 'src/utils.service';
import { UserRepo } from '../user/repo/user.repository';
import { UserService } from '../user/user.service';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { OrganizationRepo } from './repo/organization.repo';
import { CreateOrganizationUseCase } from './usecases/CreateOrganizationUseCase';
import { DeleteOrganizationUseCase } from './usecases/DeleteOrganizationUseCase';
import { GetAllOrganizationUseCase } from './usecases/GetAllOrganizationUseCase';
import { GetOrganizationUseCase } from './usecases/GetOrganizationUseCase';
import { UpdateOrganizationUseCase } from './usecases/UpdateOrganizationUseCase';

@Module({
  imports: [DatabaseModule, StorageModule, ObservabilityModule],
  controllers: [OrganizationController],
  providers: [
    OrganizationRepo,
    CreateOrganizationUseCase,
    DeleteOrganizationUseCase,
    GetOrganizationUseCase,
    UpdateOrganizationUseCase,
    GetAllOrganizationUseCase,
    UserRepo,
    {
      provide: IORGANIZATION_CONTRACT,
      useClass: OrganizationService,
    },
    {
      provide: IUSER_CONTRACT,
      useClass: UserService,
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
  exports: [
    {
      provide: IORGANIZATION_CONTRACT,
      useClass: OrganizationService,
    },
  ],
})
export class OrganizationModule {}
