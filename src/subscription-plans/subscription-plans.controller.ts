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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { UpdateSubscriptionPlanStatusDto } from './dto/update-subscription-plan-status.dto';
import { CognitoAuthGuard } from '../auth/guards/cognito-auth.guard';
import { SubscriptionPlanStatus } from '../database/models/subscription-plan.model';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Subscription Plans')
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly subscriptionPlansService: SubscriptionPlansService) {}

  @Post()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiResponse({ status: 201, description: 'Subscription plan successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ 
    status: 409, 
    description: 'Subscription plan already exists',
    type: ErrorResponseDto,
  })
  create(@Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto, @Request() req) {
    return this.subscriptionPlansService.create({
      ...createSubscriptionPlanDto,
      // created_by: req?.user?.id,
    });
  }

  @Get()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all subscription plans with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionPlanStatus })
  @ApiResponse({ status: 200, description: 'Subscription plans retrieved successfully' })
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('status') status?: SubscriptionPlanStatus,
  ) {
    return this.subscriptionPlansService.findAll(page, limit, status);
  }

  @Get('active')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active subscription plans for dropdown' })
  @ApiResponse({ status: 200, description: 'Active subscription plans retrieved successfully' })
  getActive() {
    return this.subscriptionPlansService.getActivePlans();
  }

  @Get('search')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search subscription plans' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Subscription plans found' })
  search(@Query('q') query: string) {
    return this.subscriptionPlansService.searchPlans(query);
  }

  @Get('price-range')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get plans by price range' })
  @ApiQuery({ name: 'minPrice', required: true, type: Number })
  @ApiQuery({ name: 'maxPrice', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Plans in price range retrieved successfully' })
  getPlansByPriceRange(
    @Query('minPrice', ParseIntPipe) minPrice: number,
    @Query('maxPrice', ParseIntPipe) maxPrice: number,
  ) {
    return this.subscriptionPlansService.getPlansByPriceRange(minPrice, maxPrice);
  }

  @Get(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'Subscription plan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Subscription plan not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlansService.findOne(id);
  }

  @Get(':id/feature/:feature')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if plan has specific feature' })
  @ApiResponse({ status: 200, description: 'Feature check completed' })
  checkFeature(
    @Param('id', ParseIntPipe) id: number,
    @Param('feature') feature: string,
  ) {
    return this.subscriptionPlansService.checkPlanFeature(id, feature);
  }

  @Patch(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subscription plan' })
  @ApiResponse({ status: 200, description: 'Subscription plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription plan not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubscriptionPlanDto: UpdateSubscriptionPlanDto,
    @Request() req,
  ) {
    return this.subscriptionPlansService.update(id, updateSubscriptionPlanDto, req?.user?.id);
  }

  @Patch(':id/status')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subscription plan status' })
  @ApiResponse({ status: 200, description: 'Subscription plan status updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription plan not found' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubscriptionPlanStatusDto: UpdateSubscriptionPlanStatusDto,
    @Request() req,
  ) {
    return this.subscriptionPlansService.updateStatus(id, updateSubscriptionPlanStatusDto.status, req?.user?.id);
  }

  @Post('bulk-status')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update subscription plan status' })
  @ApiResponse({ status: 200, description: 'Subscription plans status updated successfully' })
  bulkUpdateStatus(
    @Body() body: { ids: number[]; status: SubscriptionPlanStatus },
    @Request() req,
  ) {
    return this.subscriptionPlansService.bulkUpdateStatus(body.ids, body.status, req?.user?.id);
  }

  @Delete(':id')
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete subscription plan' })
  @ApiResponse({ status: 200, description: 'Subscription plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subscription plan not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionPlansService.remove(id);
  }
}