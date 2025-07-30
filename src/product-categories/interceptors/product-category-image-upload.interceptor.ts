import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import * as multer from 'multer';
import { s3ProductCategoryImageStorage } from '../s3-product-category-image-storage';

@Injectable()
export class ProductCategoryImageUploadInterceptor implements NestInterceptor {
  private upload: multer.Multer;

  constructor(private configService: ConfigService) {
    this.upload = multer({
      storage: s3ProductCategoryImageStorage(this.configService),
      limits: {
        fileSize: parseInt(this.configService.get('MAX_FILE_SIZE')) || 5242880, // 5MB default
        files: 1, // Only one file allowed
      },
      fileFilter: (req, file, cb) => {
        // Only allow image files for product_category_image
        if (file.fieldname === 'product_category_image') {
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            cb(null, true);
          } else {
            cb(new BadRequestException('Only image files (jpg, jpeg, png, gif, webp) are allowed for category images'));
          }
        } else {
          cb(new BadRequestException('Invalid field name. Only product_category_image field is allowed'));
        }
      },
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return new Observable((observer) => {
      const fields = [
        { name: 'product_category_image', maxCount: 1 },
      ];

      this.upload.fields(fields)(request, response, (error) => {
        if (error) {
          if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
              observer.error(new BadRequestException('File size too large. Maximum size is 5MB'));
            } else if (error.code === 'LIMIT_FILE_COUNT') {
              observer.error(new BadRequestException('Too many files. Only 1 image allowed per category'));
            } else {
              observer.error(new BadRequestException(`File upload error: ${error.message}`));
            }
          } else {
            observer.error(error);
          }
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