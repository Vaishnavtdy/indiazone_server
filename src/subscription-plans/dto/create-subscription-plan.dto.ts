import { IsString, IsEnum, IsNotEmpty, MaxLength, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  RfqLimit, 
  SearchVisibility, 
  MicroFairPriority, 
  TrustBadge, 
  Verification, 
  ProfilePageType, 
  PdfBrochure, 
  AiAgent 
} from '../../database/models/subscription-plan.model';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    description: 'Plan name',
    example: 'Premium Plan',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Product limit',
    example: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  product_limit?: number;

  @ApiProperty({
    description: 'RFQ limit',
    enum: RfqLimit,
    example: RfqLimit.UNLIMITED,
  })
  @IsEnum(RfqLimit)
  rfq_limit: RfqLimit;

  @ApiProperty({
    description: 'Search visibility',
    enum: SearchVisibility,
    example: SearchVisibility.ENHANCED,
  })
  @IsEnum(SearchVisibility)
  search_visibility: SearchVisibility;

  @ApiProperty({
    description: 'Micro fair priority',
    enum: MicroFairPriority,
    example: MicroFairPriority.HIGH,
  })
  @IsEnum(MicroFairPriority)
  micro_fair_priority: MicroFairPriority;

  @ApiProperty({
    description: 'Trust badge',
    enum: TrustBadge,
    example: TrustBadge.INCLUDED,
  })
  @IsEnum(TrustBadge)
  trust_badge: TrustBadge;

  @ApiProperty({
    description: 'Verification',
    enum: Verification,
    example: Verification.STRICT,
  })
  @IsEnum(Verification)
  verification: Verification;

  @ApiProperty({
    description: 'Profile page type',
    enum: ProfilePageType,
    example: ProfilePageType.ADVANCED,
  })
  @IsEnum(ProfilePageType)
  profile_page_type: ProfilePageType;

  @ApiProperty({
    description: 'PDF brochure',
    enum: PdfBrochure,
    example: PdfBrochure.DOWNLOADABLE,
  })
  @IsEnum(PdfBrochure)
  pdf_brochure: PdfBrochure;

  @ApiProperty({
    description: 'Video access',
    example: true,
  })
  @IsBoolean()
  video_access: boolean;

  @ApiProperty({
    description: 'WhatsApp chat',
    example: true,
  })
  @IsBoolean()
  whatsapp_chat: boolean;

  @ApiProperty({
    description: 'AI agent',
    enum: AiAgent,
    example: AiAgent.INCLUDED,
  })
  @IsEnum(AiAgent)
  ai_agent: AiAgent;

  @ApiProperty({
    description: 'Price',
    example: 99.99,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Duration in days',
    example: 30,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration_in_days: number;

  @ApiProperty({
    description: 'RFQ limited vendor count',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rfq_limited_vendor_count?: number;

  @ApiProperty({
    description: 'RFQ medium vendor count',
    example: 25,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rfq_medium_vendor_count?: number;

  @ApiProperty({
    description: 'RFQ high vendor count',
    example: 50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rfq_high_vendor_count?: number;

  @ApiProperty({
    description: 'Creator user ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  created_by?: number;
}