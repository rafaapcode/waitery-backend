import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './repo/product.repository';

@Module({
  controllers: [DatabaseModule, ProductController],
  providers: [ProductRepository, ProductService],
})
export class ProductModule {}
