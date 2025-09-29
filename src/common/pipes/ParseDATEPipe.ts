import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseDATEPipe implements PipeTransform {
  transform(value: string) {
    try {
      if (!value) return undefined;
      return new Date(value);
    } catch {
      throw new BadRequestException('The value must be a valid Date');
    }
  }
}
