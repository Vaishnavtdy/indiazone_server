import { S3Client } from '@aws-sdk/client-s3';
import * as multerS3 from 'multer-s3';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { Request } from 'express';

export function s3Storage(configService: ConfigService) {
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
    // acl: 'public-read', // Or 'private' depending on your needs
    metadata: function (req: Request, file, cb) {
      cb(null, { 
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      });
    },
    key: function (req: Request, file, cb) {
      // Use a custom name from the request body if available, otherwise use original name
      // For example, if the fieldname is 'logo', look for 'logo_name' in the body
      const customNameField = `${file.fieldname}_name`;
      const customName = req.body[customNameField];

      let fileName: string;
      
      if (customName) {
        // Use custom name with original extension
        fileName = `${customName}${extname(file.originalname)}`;
      } else {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        fileName = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;
      }

      // Organize files into folders based on fieldname or user ID
      const userId = req.params.id || 'general';
      const folder = file.fieldname; // e.g., 'logo', 'certificate'
      const fullPath = `uploads/${folder}/${userId}/${fileName}`;
      
      cb(null, fullPath);
    },
  });
}

export function createS3StorageForFields(configService: ConfigService, fields: string[]) {
  return s3Storage(configService);
}



