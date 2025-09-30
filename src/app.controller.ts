import { Controller, Get } from '@nestjs/common';
import { IsPublic } from './common/decorators/IsPublic';

@IsPublic()
@Controller()
export class AppController {
  @Get('health')
  getHello(): string {
    return 'Healthy !';
  }
}
