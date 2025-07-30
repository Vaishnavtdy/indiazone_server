import { S3Client } from '@aws-sdk/client-s3';
import * as multerS3 from 'multer-s3';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { Request } from 'express';

export function s3ProductImageStorage(configService: ConfigService) {
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
        productUuid: req.body.temp_product_uuid || 'unknown'
      });
    },
    key: function (req: Request, file, cb) {
      // Get temp_product_uuid from request body
      const tempProductUuid = req.body.temp_product_uuid;
      
      if (!tempProductUuid) {
        return cb(new Error('temp_product_uuid is required for product image upload'), null);
      }

      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;

      // Create S3 path: uploads/products/{temp_product_uuid}/images/{filename}
      const fullPath = `uploads/products/${tempProductUuid}/images/${fileName}`;
      
      cb(null, fullPath);
    },
  });
}