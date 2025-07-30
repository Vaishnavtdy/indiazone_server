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
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProductCategoriesService } from './product-categories.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { UpdateProductCategoryStatusDto } from './dto/update-product-category-status.dto';
import { CognitoAuthGuard } from '../auth/guards/cognito-auth.guard';
import { ProductCategoryStatus } from '../database/models/product-category.model';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { S3UploadService } from '../common/services/s3-upload.service';

@ApiTags('Product Categories')
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
    private readonly s3UploadService: S3UploadService,
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'product_category_image', maxCount: 1 }], {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed!'), false);
        }
      },
    })
  )
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new product category' })
  @ApiResponse({ status: 201, description: 'Product category successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ 
    status: 409, 
    description: 'Product category already exists',
    type: ErrorResponseDto,
  })
  async create(
    @Body() createProductCategoryDto: CreateProductCategoryDto,
    @UploadedFiles() files: { product_category_image?: Express.Multer.File[] },
  ) {
    // Validate uploaded file
    let imageFile: Express.Multer.File | undefined;
    if (files?.product_category_image && files.product_category_image.length > 0) {
      imageFile = files.product_category_image[0];
      
      // Validate file type
      if (!this.s3UploadService.isValidImageFile(imageFile)) {
        throw new Error(`Invalid file type: ${imageFile.originalname}`);
      }
    }

    return this.productCategoriesService.create(createProductCategoryDto, imageFile);
  }

  @Get()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all product categories with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ProductCategoryStatus })
  @ApiQuery({ name: 'parentId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Product categories retrieved successfully' })
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('status') status?: ProductCategoryStatus,
    // @Query('parentId', ParseIntPipe) parentId?: number,
  ) {
    return this.productCategoriesService.findAll(page, limit, status);
  }

  @Get('approved')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all approved categories for dropdown' })
  @ApiResponse({ status: 200, description: 'Approved categories retrieved successfully' })
  getApproved() {
    return this.productCategoriesService.getApprovedCategories();
  }

  @Get('root')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get root categories (no parent)' })
  @ApiResponse({ status: 200, description: 'Root categories retrieved successfully' })
  getRootCategories() {
    return this.productCategoriesService.getRootCategories();
  }

  @Get('tree')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complete category tree' })
  @ApiResponse({ status: 200, description: 'Category tree retrieved successfully' })
  getCategoryTree() {
    return this.productCategoriesService.getCategoryTree();
  }

  @Get('search')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search product categories' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Product categories found' })
  search(@Query('q') query: string) {
    return this.productCategoriesService.searchCategories(query);
  }

  @Get(':id/children')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get children of a category' })
  @ApiResponse({ status: 200, description: 'Children categories retrieved successfully' })
  getChildren(@Param('id', ParseIntPipe) id: number) {
    return this.productCategoriesService.getChildren(id);
  }

  @Get(':id/parents')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get parent hierarchy of a category' })
  @ApiResponse({ status: 200, description: 'Parent categories retrieved successfully' })
  getParents(@Param('id', ParseIntPipe) id: number) {
    return this.productCategoriesService.getParents(id);
  }

  @Get(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product category by ID' })
  @ApiResponse({ status: 200, description: 'Product category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product category not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productCategoriesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'product_category_image', maxCount: 1 }], {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed!'), false);
        }
      },
    })
  )
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update product category' })
  @ApiResponse({ status: 200, description: 'Product category updated successfully' })
  @ApiResponse({ status: 404, description: 'Product category not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductCategoryDto: UpdateProductCategoryDto,
    @UploadedFiles() files: { product_category_image?: Express.Multer.File[] },
  ) {
    // Validate uploaded file
    let imageFile: Express.Multer.File | undefined;
    if (files?.product_category_image && files.product_category_image.length > 0) {
      imageFile = files.product_category_image[0];
      
      // Validate file type
      if (!this.s3UploadService.isValidImageFile(imageFile)) {
        throw new Error(`Invalid file type: ${imageFile.originalname}`);
      }
    }

    return this.productCategoriesService.update(id, updateProductCategoryDto, imageFile);
  }

  @Patch(':id/status')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product category status' })
  @ApiResponse({ status: 200, description: 'Product category status updated successfully' })
  @ApiResponse({ status: 404, description: 'Product category not found' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductCategoryStatusDto: UpdateProductCategoryStatusDto,
  ) {
    return this.productCategoriesService.updateStatus(id, updateProductCategoryStatusDto.status);
  }

  @Post('bulk-status')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update product category status' })
  @ApiResponse({ status: 200, description: 'Product categories status updated successfully' })
  bulkUpdateStatus(
    @Body() body: { ids: number[]; status: ProductCategoryStatus },
  ) {
    return this.productCategoriesService.bulkUpdateStatus(body.ids, body.status);
  }

  @Delete(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product category' })
  @ApiResponse({ status: 200, description: 'Product category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product category not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productCategoriesService.remove(id);
  }
}