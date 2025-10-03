import { Controller, Get } from '@nestjs/common';

@Controller('order')
export class OrderController {
  @Get()
  create() {
    return { message: 'teste' };
  }
}
