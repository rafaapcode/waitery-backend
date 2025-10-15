import { Module } from '@nestjs/common';
import { HashService } from 'src/hash.service';
import {
  COMPARE_HASH,
  IORGANIZATION_CONTRACT,
  IUSER_CONTRACT,
} from 'src/shared/constants';
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
  imports: [DatabaseModule],
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
    HashService,
    {
      provide: IUSER_CONTRACT,
      useClass: UserService,
    },
    {
      provide: IORGANIZATION_CONTRACT,
      useClass: OrganizationService,
    },
    {
      provide: COMPARE_HASH,
      useFactory: (hashService: HashService) => hashService.validateHash,
      inject: [HashService],
    },
  ],
  exports: [UserService, UserRepo],
})
export class UserModule {}
