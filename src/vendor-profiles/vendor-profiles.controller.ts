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
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { VendorProfilesService } from './vendor-profiles.service';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { S3FileUploadInterceptor } from '../common/interceptors/s3-file-upload.interceptor';

@ApiTags('Vendor Profiles')
@Controller('vendor-profiles')
export class VendorProfilesController {
  constructor(
    private readonly vendorProfilesService: VendorProfilesService,
  ) {}

  @Post()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new vendor profile' })
  @ApiResponse({ status: 201, description: 'Vendor profile successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ 
    status: 409, 
    description: 'Vendor profile already exists',
    type: ErrorResponseDto,
  })
  create(@Body() createVendorProfileDto: CreateVendorProfileDto, @Request() req) {
    return this.vendorProfilesService.create({
      ...createVendorProfileDto,
      created_by: req?.user?.id,
    });
  }

  @Get()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all vendor profiles with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Vendor profiles retrieved successfully' })
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.vendorProfilesService.findAll(page, limit);
  }

  @Get('search')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search vendor profiles' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Vendor profiles found' })
  search(@Query('q') query: string) {
    return this.vendorProfilesService.searchProfiles(query);
  }

  @Get('by-business-type/:businessType')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor profiles by business type' })
  @ApiResponse({ status: 200, description: 'Vendor profiles retrieved successfully' })
  findByBusinessType(@Param('businessType') businessType: string) {
    return this.vendorProfilesService.getProfilesByBusinessType(businessType);
  }

  @Get('by-country/:country')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor profiles by country' })
  @ApiResponse({ status: 200, description: 'Vendor profiles retrieved successfully' })
  findByCountry(@Param('country') country: string) {
    return this.vendorProfilesService.getProfilesByCountry(country);
  }

  @Get('user/:userId')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor profile by user ID' })
  @ApiResponse({ status: 200, description: 'Vendor profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vendor profile not found' })
  findByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.vendorProfilesService.findByUserId(userId);
  }

  @Get(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor profile by ID' })
  @ApiResponse({ status: 200, description: 'Vendor profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vendor profile not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorProfilesService.findOne(id);
  }

  @Patch(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor profile' })
  @ApiResponse({ status: 200, description: 'Vendor profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Vendor profile not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorProfileDto: UpdateVendorProfileDto,
    @Request() req,
  ) {
    return this.vendorProfilesService.update(id, updateVendorProfileDto, req?.user?.id);
  }

  @Patch(':id/files')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(S3FileUploadInterceptor)
  @ApiOperation({ summary: 'Upload vendor profile files' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Vendor profile not found' })
  uploadFiles(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: { 
      logo?: Express.Multer.File[], 
      certificate?: Express.Multer.File[] 
    },
    @Request() req,
  ) {
    const fileUrls: { logo?: string; certificate?: string } = {};
    
    if (files.logo && files.logo[0]) {
      fileUrls.logo = (files.logo[0] as any).location; // S3 location URL
    }
    
    if (files.certificate && files.certificate[0]) {
      fileUrls.certificate = (files.certificate[0] as any).location; // S3 location URL
    }

    return this.vendorProfilesService.updateFiles(id, fileUrls, req?.user?.id);
  }

  @Delete(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete vendor profile' })
  @ApiResponse({ status: 200, description: 'Vendor profile deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vendor profile not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorProfilesService.remove(id);
  }
}