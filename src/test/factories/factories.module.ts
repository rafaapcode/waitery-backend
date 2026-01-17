import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infra/database/database.module';
import { FactoriesService } from './factories.service';

@Module({
  imports: [DatabaseModule],
  providers: [FactoriesService],
  exports: [FactoriesService],
})
export class FactoriesModule {}
