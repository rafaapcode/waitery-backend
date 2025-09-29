import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValid } from 'ulid';

@Injectable()
export class ParseULIDPipe implements PipeTransform {
  transform(value: string) {
    const isValidId = isValid(value);

    if (!isValidId) throw new BadRequestException('Params is not a valid ID');

    return value;
  }
}
