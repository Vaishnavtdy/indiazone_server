import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileUploadService {
  private s3: S3Client;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
      region: this.configService.get('AWS_REGION'),
    });
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
      
      // Extract key from S3 URL
      const urlParts = fileUrl.split('/');
      const key = urlParts.slice(3).join('/'); // Remove https://bucket.s3.region.amazonaws.com/

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3.send(command);

      return true;
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      return false;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3, command, { expiresIn });
  }
  async listFiles(prefix: string): Promise<any[]> {
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });
    
    const result = await this.s3.send(command);

    return result.Contents || [];
  }
}