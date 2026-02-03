import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { ExceptionFilterWithSentry } from './common/filters/exception.filter';
import { AuthGuard } from './common/guards/auth-guard.guard';
import { ObservabilityModule } from './infra/observability/observability.module';
import { ObservabilityService } from './infra/observability/observability.service';
import { StorageModule } from './infra/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { OrderModule } from './modules/order/order.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ProductModule } from './modules/product/product.module';
import { UserModule } from './modules/user/user.module';
import { WsModule } from './modules/ws/ws.module';
import { env } from './shared/config/env';
import { IUTILS_SERVICE } from './shared/constants';
import { FactoriesModule } from './test/factories/factories.module';
import { UtilsService } from './utils.service';

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
    IngredientModule,
    CategoryModule,
    OrderModule,
    ProductModule,
    WsModule,
    StorageModule,
    FactoriesModule,
    ObservabilityModule,
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
    { provide: IUTILS_SERVICE, useClass: UtilsService },
    ObservabilityService,
  ],
  exports: [
    { provide: IUTILS_SERVICE, useClass: UtilsService },
    ObservabilityService,
  ],
})
export class AppModule {}
