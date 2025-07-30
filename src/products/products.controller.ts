import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Request,
  Logger,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CreateProductWithFilesDto } from "./dto/create-product-with-files.dto";
import { UpdateProductStatusDto } from "./dto/update-product-status.dto";
import { ProductQueryDto } from "./dto/product-query.dto";
import { ProductStatus } from "../database/models/product.model";
import { ErrorResponseDto } from "../common/dto/error-response.dto";
import { CreateProductImageDto } from "./dto/create-product.dto";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { S3UploadService } from "../common/services/s3-upload.service";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly s3UploadService: S3UploadService
  ) {}
  private readonly logger = new Logger(ProductsController.name); // Initialize Logger

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: "product_images", maxCount: 10 }], {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error("Only image files are allowed!"), false);
        }
      },
    })
  )
  @ApiOperation({ summary: "Create a new product with variants and images" })
  @ApiResponse({ status: 201, description: "Product successfully created" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "Product already exists",
    type: ErrorResponseDto,
  })
  @ApiConsumes("multipart/form-data")
  async createWithImages(
    @Body() createProductWithFilesDto: CreateProductWithFilesDto,
    @UploadedFiles() files: { product_images?: Express.Multer.File[] },
    @Request() req
  ) {
    // Validate uploaded files
    if (!files || !files.product_images || files.product_images.length === 0) {
      this.logger.warn("No files uploaded");
    } else {
      // Validate each file
      for (const file of files.product_images) {
        if (!this.s3UploadService.isValidImageFile(file)) {
          throw new Error(`Invalid file type: ${file.originalname}`);
        }
      }
    }

    const basicProductDto = {
      ...createProductWithFilesDto,
      images: undefined,
    };

    // 1. Create the product first
    const product = await this.productsService.create(basicProductDto, parseInt(process.env.ADMIN_USER_ID));

    // 2. Upload images to S3 AFTER product creation
    if (files?.product_images && files.product_images.length > 0) {
      try {
        const imageUrls = await this.s3UploadService.uploadProductImages(files.product_images, product.id);

        // 3. Create image DTOs with S3 URLs
        const imagesDtos: CreateProductImageDto[] = imageUrls.map((imageUrl, index) => ({
          image_url: imageUrl,
          alt_text: `${createProductWithFilesDto.name} - Image ${index + 1}`,
          is_primary: index === 0,
          sort_order: index,
        }));

        // 4. Save image records to database
        await this.productsService.updateProductImages(product.id, imagesDtos, parseInt(process.env.ADMIN_USER_ID));

        this.logger.log(`Successfully uploaded ${imageUrls.length} images for product ${product.id}`);
      } catch (error) {
        this.logger.error(`Failed to upload images for product ${product.id}:`, error);

        // Optional: You might want to delete the product if image upload fails
        // await this.productsService.delete(product.id);

        throw new Error(`Product created but image upload failed: ${error.message}`);
      }
    }

    return this.productsService.findOne(product.id, req.user?.id || parseInt(process.env.ADMIN_USER_ID));
  }

  @Get()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all products with advanced filtering and pagination",
  })
  @ApiResponse({ status: 200, description: "Products retrieved successfully" })
  findAll(@Query() query: ProductQueryDto, @Request() req) {
    return this.productsService.findAll(query, req.user?.id || parseInt(process.env.ADMIN_USER_ID));
  }

  @Get("search")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Search products by name, description, or specification",
  })
  @ApiQuery({ name: "q", required: true, type: String })
  @ApiResponse({ status: 200, description: "Products found" })
  search(@Query("q") query: string, @Request() req) {
    return this.productsService.findAll({ search: query }, req.user?.id || 1);
  }

  @Get("by-category/:categoryId")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get products by category" })
  @ApiResponse({ status: 200, description: "Products retrieved successfully" })
  findByCategory(@Param("categoryId", ParseIntPipe) categoryId: number, @Request() req) {
    return this.productsService.findAll({ category_id: categoryId }, req.user?.id || 1);
  }

  @Get("by-client/:clientId")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get products by client" })
  @ApiResponse({ status: 200, description: "Products retrieved successfully" })
  findByClient(@Param("clientId", ParseIntPipe) clientId: number, @Request() req) {
    return this.productsService.findAll({ client_id: clientId }, req.user?.id || 1);
  }

  @Get(":id")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get product by ID with all related data" })
  @ApiResponse({ status: 200, description: "Product retrieved successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
  findOne(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return this.productsService.findOne(id, req.user?.id || 1);
  }

  @Get(":id/images")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all images for a product" })
  @ApiResponse({
    status: 200,
    description: "Product images retrieved successfully",
  })
  getImages(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return this.productsService.getProductImages(id, req.user?.id || 1);
  }

  @Patch(":id")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update product with variants and images" })
  @ApiResponse({ status: 200, description: "Product updated successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto, @Request() req) {
    return this.productsService.update(id, updateProductDto, req.user?.id || 1);
  }

  @Patch(":id/status")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update product status with business rule validation",
  })
  @ApiResponse({
    status: 200,
    description: "Product status updated successfully",
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() updateProductStatusDto: UpdateProductStatusDto, @Request() req) {
    return this.productsService.updateStatus(id, updateProductStatusDto.status, req.user?.id || 1);
  }

  @Patch("image/:imageId/order")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update image sort order" })
  @ApiResponse({ status: 200, description: "Image order updated successfully" })
  updateImageOrder(@Param("imageId", ParseIntPipe) imageId: number, @Body() body: { sort_order: number }, @Request() req) {
    return this.productsService.updateImageOrder(imageId, body.sort_order, req.user?.id || 1);
  }

  @Patch("image/:imageId/primary")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Set image as primary" })
  @ApiResponse({
    status: 200,
    description: "Primary image updated successfully",
  })
  setPrimaryImage(@Param("imageId", ParseIntPipe) imageId: number, @Request() req) {
    return this.productsService.setPrimaryImage(imageId, req.user?.id || 1);
  }

  @Post("bulk-status")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bulk update product status" })
  @ApiResponse({
    status: 200,
    description: "Products status updated successfully",
  })
  bulkUpdateStatus(@Body() body: { ids: number[]; status: ProductStatus }, @Request() req) {
    return this.productsService.bulkUpdateStatus(body.ids, body.status, req.user?.id || 1);
  }

  @Delete(":id")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete product (only draft products)" })
  @ApiResponse({ status: 200, description: "Product deleted successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 400, description: "Cannot delete non-draft products" })
  remove(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return this.productsService.remove(id, req.user?.id || 1);
  }
}
