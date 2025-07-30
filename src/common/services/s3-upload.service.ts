// src/common/services/s3-upload.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

export interface S3UploadOptions {
  folder?: string;
  makePublic?: boolean;
  contentType?: string;
}

export interface S3DeleteOptions {
  keys: string[];
}

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>("AWS_S3_BUCKET_NAME");
    this.region = this.configService.get<string>("AWS_REGION");

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.configService.get<string>(
          "AWS_SECRET_ACCESS_KEY"
        ),
      },
    });
  }

  /**
   * Upload a single file to S3
   */
  async uploadFile(
    file: Express.Multer.File,
    key: string,
    options: S3UploadOptions = {}
  ): Promise<string> {
    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: options.contentType || file.mimetype,
        ...(options.makePublic && { ACL: "public-read" }),
      });

      await this.s3Client.send(uploadCommand);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      this.logger.log(`File uploaded successfully: ${url}`);

      return url;
    } catch (error) {
      this.logger.error(
        `Failed to upload file to S3: ${error.message}`,
        error.stack
      );
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Upload product image with automatic key generation
   */
  async uploadProductImage(
    file: Express.Multer.File,
    productId: number,
    index: number,
    options: S3UploadOptions = {}
  ): Promise<string> {
    const key = this.generateProductImageKey(
      file,
      productId,
      index,
      options.folder
    );
    return this.uploadFile(file, key, { ...options, makePublic: true });
  }

  /**
   * Upload multiple product images
   */
  async uploadProductImages(
    files: Express.Multer.File[],
    productId: number,
    options: S3UploadOptions = {}
  ): Promise<string[]> {
    const uploadPromises = files.map((file, index) =>
      this.uploadProductImage(file, productId, index, options)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error(`Failed to upload multiple images: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a single file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from S3: ${error.message}`,
        error.stack
      );
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from S3
   */
  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: false,
        },
      });

      const result = await this.s3Client.send(deleteCommand);

      if (result.Deleted) {
        this.logger.log(`Successfully deleted ${result.Deleted.length} files`);
      }

      if (result.Errors && result.Errors.length > 0) {
        this.logger.error(`Failed to delete some files:`, result.Errors);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete files from S3: ${error.message}`,
        error.stack
      );
      throw new Error(`S3 bulk delete failed: ${error.message}`);
    }
  }

  /**
   * Delete all images for a product
   */
  async deleteProductImages(productId: number): Promise<void> {
    // Note: This is a simplified version. In production, you might want to
    // list objects first to get all keys for the product
    const folderPrefix = `products/${productId}/`;

    // You would need to implement listObjects to get all keys first
    // For now, this is a placeholder for the delete logic
    this.logger.log(`Deleting all images for product ${productId}`);
  }

  /**
   * Extract S3 key from full URL
   */
  extractKeyFromUrl(url: string): string {
    const baseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/`;
    return url.replace(baseUrl, "");
  }

  /**
   * Generate unique key for product image
   */
  private generateProductImageKey(
    file: Express.Multer.File,
    productId: number,
    index: number,
    customFolder?: string
  ): string {
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1e9);
    const fileExtension = this.getFileExtension(file.originalname);

    const folder = customFolder || `products/${productId}`;
    return `${folder}/${timestamp}-${randomString}-${index}.${fileExtension}`;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || "jpg";
  }

  /**
   * Validate if file is an image
   */
  isValidImageFile(file: Express.Multer.File): boolean {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    return allowedMimeTypes.includes(file.mimetype);
  }

  /**
   * Get S3 client instance (for advanced operations)
   */
  getS3Client(): S3Client {
    return this.s3Client;
  }
}
