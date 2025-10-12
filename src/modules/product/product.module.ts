import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { IPRODUCT_CONTRACT } from 'src/shared/constants';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './repo/product.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductController],
  providers: [
    ProductRepository,
    {
      provide: IPRODUCT_CONTRACT,
      useClass: ProductService,
    },
  ],
})
export class ProductModule {}
