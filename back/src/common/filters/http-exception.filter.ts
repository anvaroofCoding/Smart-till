import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { translateApiMessages } from '../utils/api-message.util';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : this.isPayloadTooLarge(exception)
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Ichki server xatosi. Keyinroq qayta urinib ko\'ring';
    let errors: Record<string, string[]> | undefined;
    let retryAfterSeconds: number | undefined;

    if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      message = 'So\'rov hajmi juda katta (rasm 2 MB dan oshmasligi kerak)';
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const rawMessage = (exceptionResponse as { message: unknown }).message;
      if (Array.isArray(rawMessage)) {
        const translated = translateApiMessages(
          rawMessage.filter((entry): entry is string => typeof entry === 'string'),
        );
        message = Array.isArray(translated)
          ? translated.join('. ')
          : translated ?? message;
      } else if (typeof rawMessage === 'string') {
        const translated = translateApiMessages(rawMessage);
        message = typeof translated === 'string' ? translated : message;
      }

      if ('errors' in exceptionResponse) {
        errors = (exceptionResponse as { errors: Record<string, string[]> }).errors;
      }

      if (
        'retryAfterSeconds' in exceptionResponse &&
        typeof (exceptionResponse as { retryAfterSeconds?: unknown }).retryAfterSeconds ===
          'number'
      ) {
        retryAfterSeconds = (exceptionResponse as { retryAfterSeconds: number })
          .retryAfterSeconds;
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      status,
      message,
      ...(errors ? { errors } : {}),
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private isPayloadTooLarge(exception: unknown): boolean {
    if (!exception || typeof exception !== 'object') {
      return false;
    }

    const err = exception as { type?: string; status?: number; statusCode?: number };
    return (
      err.type === 'entity.too.large' ||
      err.status === 413 ||
      err.statusCode === 413
    );
  }
}
