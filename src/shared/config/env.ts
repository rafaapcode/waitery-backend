import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

class Env {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  REFRESH_JWT_SECRET: string;

  @IsNumberString()
  @IsNotEmpty()
  PORT: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  // @IsString()
  // @IsNotEmpty()
  // @IsUrl({
  //   protocols: ['http', 'https'],
  //   require_protocol: true,
  // })
  // IMAGE_URL: string;
}

export const env = plainToInstance(Env, {
  JWT_SECRET: process.env.JWT_SECRET,
  REFRESH_JWT_SECRET: process.env.REFRESH_JWT_SECRET,
  PORT: process.env.PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  DATABASE_URL: process.env.DATABASE_URL,
});

const errors = validateSync(env);

if (errors.length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
