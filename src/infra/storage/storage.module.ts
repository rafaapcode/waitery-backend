import { Module } from '@nestjs/common';
import { ObservabilityModule } from '../observability/observability.module';
import { StorageService } from './storage.service';

@Module({
  imports: [ObservabilityModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
