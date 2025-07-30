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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductCategoriesService } from './product-categories.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { UpdateProductCategoryStatusDto } from './dto/update-product-category-status.dto';
import { CognitoAuthGuard } from '../auth/guards/cognito-auth.guard';
import { ProductCategoryStatus } from '../database/models/product-category.model';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Product Categories')
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  @Post()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product category' })
  @ApiResponse({ status: 201, description: 'Product category successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ 
    status: 409, 
    description: 'Product category already exists',
    type: ErrorResponseDto,
  })
  create(@Body() createProductCategoryDto: CreateProductCategoryDto) {
    return this.productCategoriesService.create(createProductCategoryDto);
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
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product category' })
  @ApiResponse({ status: 200, description: 'Product category updated successfully' })
  @ApiResponse({ status: 404, description: 'Product category not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductCategoryDto: UpdateProductCategoryDto,
  ) {
    return this.productCategoriesService.update(id, updateProductCategoryDto);
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