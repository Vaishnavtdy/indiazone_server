import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlanStatus } from '../../database/models/subscription-plan.model';

export class UpdateSubscriptionPlanStatusDto {
  @ApiProperty({
    description: 'Subscription plan status',
    enum: SubscriptionPlanStatus,
    example: SubscriptionPlanStatus.ACTIVE,
  })
  @IsEnum(SubscriptionPlanStatus)
  status: SubscriptionPlanStatus;
}