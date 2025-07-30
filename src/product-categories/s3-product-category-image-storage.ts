import { S3Client } from '@aws-sdk/client-s3';
import * as multerS3 from 'multer-s3';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { Request } from 'express';

export function s3ProductCategoryImageStorage(configService: ConfigService) {
  const s3 = new S3Client({
    credentials: {
      accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
    },
    region: configService.get('AWS_REGION'),
  });

  const bucketName = configService.get('AWS_S3_BUCKET_NAME');

  return multerS3({
    s3: s3,
    bucket: bucketName,
    metadata: function (req: Request, file, cb) {
      cb(null, { 
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
        categoryId: req.params.id || 'new'
      });
    },
    key: function (req: Request, file, cb) {
      // Get category ID from request params (for updates) or generate temp ID for new categories
      const categoryId = req.params.id || 'temp-' + Date.now();
      
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = `category-image-${uniqueSuffix}${extname(file.originalname)}`;

      // Create S3 path: uploads/product-categories/{categoryId}/images/{filename}
      const fullPath = `uploads/product-categories/${categoryId}/images/${fileName}`;
      
      cb(null, fullPath);
    },
  });
}