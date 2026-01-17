import { Module } from '@nestjs/common';
import { FactoriesService } from './factories.service';

@Module({
  providers: [FactoriesService],
  exports: [FactoriesService],
})
export class FactoriesModule {}
