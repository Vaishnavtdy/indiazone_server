import { Module } from "@nestjs/common";
import { FileUploadService } from "./services/file-upload.service";
import { S3FileUploadInterceptor } from "./interceptors/s3-file-upload.interceptor";
import { S3UploadService } from "./services/s3-upload.service";

@Module({
  providers: [FileUploadService, S3FileUploadInterceptor, S3UploadService],
  exports: [FileUploadService, S3FileUploadInterceptor, S3UploadService],
})
export class CommonModule {}
