import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import * as sentry from '@sentry/nestjs';
import { Request, Response } from 'express';
import { env } from 'src/shared/config/env';

@Catch(HttpException)
export class ExceptionFilterWithSentry<T extends HttpException>
  implements ExceptionFilter
{
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const err =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : exceptionResponse;

    if (env.NODE_ENV === 'PROD') {
      if (statusCode >= 500) {
        sentry.logger.error(
          JSON.stringify({
            ...err,
            date: new Date().toISOString(),
            url: req.url,
            stack: exception.stack || 'No stack found',
          }),
        );
      }
    }

    res.status(statusCode).json({
      ...err,
    });
  }
}
