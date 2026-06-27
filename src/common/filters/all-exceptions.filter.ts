import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { isCloudinaryError, toUploadHttpException } from '../utils/upload-errors';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const httpException = this.toHttpException(exception);
    const status = httpException.getStatus();
    const message = this.extractMessage(httpException.getResponse());

    if (isCloudinaryError(exception)) {
      this.logger.warn(
        `${request.method} ${request.url} → Cloudinary: ${exception.message}`,
      );
    } else if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }

  private toHttpException(exception: unknown): HttpException {
    if (exception instanceof HttpException) {
      return exception;
    }

    if (isCloudinaryError(exception)) {
      return toUploadHttpException(exception);
    }

    if (exception instanceof Error) {
      if (exception.message === 'Apenas imagens são permitidas') {
        return new BadRequestException(exception.message);
      }
    }

    return new InternalServerErrorException('Erro interno do servidor');
  }

  private extractMessage(body: string | object): string {
    if (typeof body === 'string') return body;

    const record = body as { message?: string | string[] };
    if (Array.isArray(record.message)) {
      return record.message[0] ?? 'Erro na requisição';
    }
    if (typeof record.message === 'string') {
      return record.message;
    }

    return 'Erro na requisição';
  }
}
