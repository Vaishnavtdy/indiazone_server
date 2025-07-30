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
import { BusinessTypesService } from './business-types.service';
import { CreateBusinessTypeDto } from './dto/create-business-type.dto';
import { UpdateBusinessTypeDto } from './dto/update-business-type.dto';
import { UpdateBusinessTypeStatusDto } from './dto/update-business-type-status.dto';
import { CognitoAuthGuard } from '../auth/guards/cognito-auth.guard';
import { BusinessTypeStatus } from '../database/models/business-type.model';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Business Types')
@Controller('business-types')
export class BusinessTypesController {
  constructor(private readonly businessTypesService: BusinessTypesService) {}

  @Post()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new business type' })
  @ApiResponse({ status: 201, description: 'Business type successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ 
    status: 409, 
    description: 'Business type already exists',
    type: ErrorResponseDto,
  })
  create(@Body() createBusinessTypeDto: CreateBusinessTypeDto) {
    return this.businessTypesService.create(createBusinessTypeDto);
  }

  @Get()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all business types with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: BusinessTypeStatus })
  @ApiResponse({ status: 200, description: 'Business types retrieved successfully' })
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('status') status?: BusinessTypeStatus,
  ) {
    return this.businessTypesService.findAll(page, limit, status);
  }

  @Get('active')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active business types for dropdown' })
  @ApiResponse({ status: 200, description: 'Active business types retrieved successfully' })
  getActive() {
    return this.businessTypesService.getActiveBusinessTypes();
  }

  @Get('search')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search business types' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Business types found' })
  search(@Query('q') query: string) {
    return this.businessTypesService.searchBusinessTypes(query);
  }

  @Get(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get business type by ID' })
  @ApiResponse({ status: 200, description: 'Business type retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Business type not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.businessTypesService.findOne(id);
  }

  @Patch(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update business type' })
  @ApiResponse({ status: 200, description: 'Business type updated successfully' })
  @ApiResponse({ status: 404, description: 'Business type not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBusinessTypeDto: UpdateBusinessTypeDto,
  ) {
    return this.businessTypesService.update(id, updateBusinessTypeDto);
  }

  @Patch(':id/status')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update business type status' })
  @ApiResponse({ status: 200, description: 'Business type status updated successfully' })
  @ApiResponse({ status: 404, description: 'Business type not found' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBusinessTypeStatusDto: UpdateBusinessTypeStatusDto,
  ) {
    return this.businessTypesService.updateStatus(id, updateBusinessTypeStatusDto.status);
  }

  @Post('bulk-status')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update business type status' })
  @ApiResponse({ status: 200, description: 'Business types status updated successfully' })
  bulkUpdateStatus(
    @Body() body: { ids: number[]; status: BusinessTypeStatus },
  ) {
    return this.businessTypesService.bulkUpdateStatus(body.ids, body.status);
  }

  @Delete(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete business type' })
  @ApiResponse({ status: 200, description: 'Business type deleted successfully' })
  @ApiResponse({ status: 404, description: 'Business type not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.businessTypesService.remove(id);
  }
}