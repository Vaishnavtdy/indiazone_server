import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import * as multer from 'multer';
import { s3Storage } from '../s3-storage';

@Injectable()
export class S3FileUploadInterceptor implements NestInterceptor {
  private upload: multer.Multer;

  constructor(private configService: ConfigService) {
    this.upload = multer({
      storage: s3Storage(this.configService),
      limits: {
        fileSize: parseInt(this.configService.get('MAX_FILE_SIZE')) || 5242880, // 5MB default
      },
      fileFilter: (req, file, cb) => {
        // Allow images for logo
        if (file.fieldname === 'logo') {
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            cb(null, true);
          } else {
            cb(null, false);
          }
        }
        // Allow PDF and images for certificate (handle both 'certificate' and 'business_registration_certificate')
        else if (file.fieldname === 'certificate' || file.fieldname === 'business_registration_certificate') {
          if (file.mimetype.match(/\/(pdf|jpg|jpeg|png)$/)) {
            cb(null, true);
          } else {
            cb(null, false);
          }
        } else {
          cb(null, true);
        }
      },
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return new Observable((observer) => {
      const fields = [
        { name: 'logo', maxCount: 1 },
        { name: 'certificate', maxCount: 1 },
        { name: 'business_registration_certificate', maxCount: 1 },
      ];

      this.upload.fields(fields)(request, response, (error) => {
        if (error) {
          observer.error(error);
        } else {
          next.handle().subscribe({
            next: (data) => observer.next(data),
            error: (err) => observer.error(err),
            complete: () => observer.complete(),
          });
        }
      });
    });
  }
}