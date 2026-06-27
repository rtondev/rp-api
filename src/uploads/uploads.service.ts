import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { toUploadHttpException, isCloudinaryError } from '../common/utils/upload-errors';

export interface UploadedImage {
  url: string;
  publicId: string;
}

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private configured = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET')?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Cloudinary não configurado (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY ou CLOUDINARY_API_SECRET ausentes). Uploads vão falhar.',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.configured = true;
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'rotapotiguar',
  ): Promise<UploadedImage> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo de imagem inválido');
    }

    if (!this.configured) {
      throw toUploadHttpException({
        message: 'Cloudinary not configured',
        http_code: 401,
      });
    }

    try {
      return await new Promise<UploadedImage>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error ?? new Error('Falha ao enviar imagem'));
              return;
            }

            resolve({
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
            });
          },
        );

        stream.end(file.buffer);
      });
    } catch (error) {
      if (isCloudinaryError(error)) {
        this.logger.warn(
          `Cloudinary upload falhou [${error.http_code}]: ${error.message}`,
        );
      }
      throw toUploadHttpException(error);
    }
  }
}
