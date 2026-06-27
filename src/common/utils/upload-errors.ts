import {
  HttpException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';

type CloudinaryLikeError = {
  message?: string;
  http_code?: number;
  name?: string;
};

export function isCloudinaryError(error: unknown): error is CloudinaryLikeError {
  if (!error || typeof error !== 'object') return false;
  return typeof (error as CloudinaryLikeError).http_code === 'number';
}

export function toUploadHttpException(error: unknown): HttpException {
  if (error instanceof HttpException) {
    return error;
  }

  if (isCloudinaryError(error)) {
    const msg = error.message?.toLowerCase() ?? '';

    if (
      error.http_code === 401 ||
      error.http_code === 403 ||
      msg.includes('invalid cloud_name') ||
      msg.includes('invalid api key') ||
      msg.includes('unknown api key') ||
      msg.includes('invalid signature')
    ) {
      return new ServiceUnavailableException(
        'Serviço de imagens indisponível. Verifique as credenciais do Cloudinary (cloud name, API key e secret).',
      );
    }

    if (error.http_code === 400 || msg.includes('file size')) {
      return new InternalServerErrorException(
        'A imagem não pôde ser processada. Tente outro arquivo.',
      );
    }

    return new ServiceUnavailableException(
      'Não foi possível enviar a imagem no momento. Tente novamente em instantes.',
    );
  }

  if (error instanceof Error && error.message) {
    if (error.message === 'Apenas imagens são permitidas') {
      return new HttpException(error.message, 400);
    }
    return new InternalServerErrorException(
      'Não foi possível enviar a imagem. Tente novamente.',
    );
  }

  return new InternalServerErrorException(
    'Não foi possível enviar a imagem. Tente novamente.',
  );
}
