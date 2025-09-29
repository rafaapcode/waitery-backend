import { Module } from '@nestjs/common';
import { HashService } from 'src/hash.service';
import { DatabaseModule } from 'src/infra/database/database.module';
import { IAUTH_CONTRACT } from 'src/shared/constants';
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
    HashService,
    {
      provide: IAUTH_CONTRACT,
      useClass: AuthService,
    },
  ],
})
export class AuthModule {}
