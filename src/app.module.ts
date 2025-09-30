import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { ExceptionFilterWithSentry } from './common/filters/exception.filter';
import { AuthGuard } from './common/guards/auth-guard.guard';
import { HashService } from './hash.service';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { UserModule } from './modules/user/user.module';
import { env } from './shared/config/env';

@Module({
  imports: [
    SentryModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '2h', algorithm: 'HS256' },
    }),
    AuthModule,
    UserModule,
    OrganizationModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilterWithSentry,
    },
    HashService,
  ],
  exports: [HashService],
})
export class AppModule {}
