import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import * as multer from 'multer';
import { s3ProductImageStorage } from '../s3-product-image-storage';

@Injectable()
export class ProductImageUploadInterceptor implements NestInterceptor {
  private upload: multer.Multer;

  constructor(private configService: ConfigService) {
    this.upload = multer({
      storage: s3ProductImageStorage(this.configService),
      limits: {
        fileSize: parseInt(this.configService.get('MAX_FILE_SIZE')) || 5242880, // 5MB default
        files: 10, // Maximum 10 images per product
      },
      fileFilter: (req, file, cb) => {
        // Only allow image files for product_images
        if (file.fieldname === 'product_images') {
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            cb(null, true);
          } else {
            cb(new BadRequestException('Only image files (jpg, jpeg, png, gif, webp) are allowed for product images'));
          }
        } else {
          cb(new BadRequestException('Invalid field name. Only product_images field is allowed'));
        }
      },
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
      console.log("request.body")
       console.log(request)
    return new Observable((observer) => {
      // Validate temp_product_uuid before processing files
      if (!request.body.temp_product_uuid) {
        observer.error(new BadRequestException('temp_product_uuid is required for product image upload'));
        return;
      }

      const fields = [
        { name: 'product_images', maxCount: 10 },
      ];

      this.upload.fields(fields)(request, response, (error) => {
        if (error) {
          if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
              observer.error(new BadRequestException('File size too large. Maximum size is 5MB per file'));
            } else if (error.code === 'LIMIT_FILE_COUNT') {
              observer.error(new BadRequestException('Too many files. Maximum 10 images allowed per product'));
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