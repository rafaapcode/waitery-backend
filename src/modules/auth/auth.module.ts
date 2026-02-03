import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { IAUTH_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';
import { UtilsService } from 'src/utils.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignInUseCase } from './usecases/SignInUseCase';
import { SignUpUseCase } from './usecases/SignUpUseCase';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    SignInUseCase,
    SignUpUseCase,
    {
      provide: IAUTH_CONTRACT,
      useClass: AuthService,
    },
    {
      provide: IUTILS_SERVICE,
      useClass: UtilsService,
    },
  ],
})
export class AuthModule {}
