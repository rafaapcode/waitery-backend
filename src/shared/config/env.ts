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
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  CEP_SERVICE_API_URL: string;

  @IsString()
  @IsNotEmpty()
  PRESIGNED_URL_SERVICE_API_URL: string;

  @IsString()
  @IsNotEmpty()
  CDN_URL: string;

  @IsString()
  @IsNotEmpty()
  NODE_ENV: 'DEV' | 'PROD';
}

export const env = plainToInstance(Env, {
  JWT_SECRET: process.env.JWT_SECRET,
  REFRESH_JWT_SECRET: process.env.REFRESH_JWT_SECRET,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  CEP_SERVICE_API_URL: process.env.CEP_SERVICE_API_URL,
  PRESIGNED_URL_SERVICE_API_URL: process.env.PRESIGNED_URL_SERVICE_API_URL,
  CDN_URL: process.env.CDN_URL,
  NODE_ENV: process.env.NODE_ENV ?? 'DEV',
});

const errors = validateSync(env);

if (errors.length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
