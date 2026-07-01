import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { env } from 'src/shared/config/env';

@Catch()
export class ExceptionFilterWithSentry implements ExceptionFilter {
  constructor(private readonly observabilityService: ObservabilityService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let err: any;
    if (isHttpException) {
      const exceptionResponse = exception.getResponse();
      err =
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : exceptionResponse;
    } else {
      const message =
        env.NODE_ENV !== 'PROD' && exception instanceof Error
          ? exception.message
          : 'Internal server error';

      err = {
        statusCode,
        message,
        error: exception instanceof Error ? exception.name : 'InternalServerError',
      };
    }

    if (statusCode >= 500) {
      this.observabilityService.error(
        ExceptionFilterWithSentry.name,
        JSON.stringify({
          ...err,
          date: new Date().toISOString(),
          url: req.url,
          stack: exception instanceof Error ? exception.stack : 'No stack found',
        }),
        exception instanceof Error ? exception : String(exception),
      );
    }

    res.status(statusCode).json({
      ...err,
    });
  }
}
