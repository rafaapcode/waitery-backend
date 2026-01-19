import { Module } from '@nestjs/common';
import { StorageModule } from 'src/infra/storage/storage.module';
import { StorageService } from 'src/infra/storage/storage.service';
import {
  IORGANIZATION_CONTRACT,
  ISTORAGE_SERVICE,
  IUSER_CONTRACT,
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { UtilsService } from 'src/utils.service';
import { OrganizationService } from '../organization/organization.service';
import { OrganizationRepo } from '../organization/repo/organization.repo';
import { DatabaseModule } from './../../infra/database/database.module';
import { UserRepo } from './repo/user.repository';
import { CreateUserUseCase } from './usecases/CreateUserUseCase';
import { DeleteUserUseCase } from './usecases/DeleteUserUseCase';
import { GetAllUserUseCase } from './usecases/GetAllUserUseCase';
import { GetMeUseCase } from './usecases/GetMeUseCase';
import { GetOrgsOfUserUseCase } from './usecases/GetOrgsOfUserUseCase';
import { GetUserUseCase } from './usecases/GetUserUseCase';
import { UpdateMeUseCase } from './usecases/UpdateMeUseCase';
import { UpdateUserUseCase } from './usecases/UpdateUserUseCase';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [UserController],
  providers: [
    UserRepo,
    UserService,
    OrganizationRepo,
    CreateUserUseCase,
    DeleteUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    GetMeUseCase,
    UpdateMeUseCase,
    GetAllUserUseCase,
    GetOrgsOfUserUseCase,
    {
      provide: IUSER_CONTRACT,
      useClass: UserService,
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
  exports: [UserService, UserRepo],
})
export class UserModule {}
