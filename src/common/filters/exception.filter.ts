import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { env } from 'src/shared/config/env';

@Catch(HttpException)
export class ExceptionFilterWithSentry<T extends HttpException>
  implements ExceptionFilter
{
  constructor(private readonly observabilityService: ObservabilityService) {}

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
        this.observabilityService.error(
          ExceptionFilterWithSentry.name,
          JSON.stringify({
            ...err,
            date: new Date().toISOString(),
            url: req.url,
            stack: exception.stack || 'No stack found',
          }),
          exception.stack || 'No stack found',
        );
      }
    }

    res.status(statusCode).json({
      ...err,
    });
  }
}
