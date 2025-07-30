import { Column, Model, Table, DataType, CreatedAt, UpdatedAt, Index } from 'sequelize-typescript';

export enum RfqLimit {
  LIMITED = 'Limited',
  MEDIUM = 'Medium',
  UNLIMITED = 'Unlimited',
  AS_PER_PRIORITY = 'As Per Priority',
}

export enum SearchVisibility {
  NORMAL = 'Normal',
  ENHANCED = 'Enhanced',
  TOP = 'Top',
  SECTOR_PRIORITY = 'Sector Priority',
}

export enum MicroFairPriority {
  NONE = 'None',
  MEDIUM = 'Medium',
  HIGH = 'High',
  SECTOR_PRIORITY = 'Sector Priority',
}

export enum TrustBadge {
  NOT_INCLUDED = 'Not Included',
  INCLUDED = 'Included',
  MANDATORY = 'Mandatory',
}

export enum Verification {
  INCLUDED = 'Included',
  STRICT = 'Strict',
}

export enum ProfilePageType {
  BASIC = 'Basic',
  ADVANCED = 'Advanced',
  FULLY_CUSTOMIZED = 'Fully Customized',
}

export enum PdfBrochure {
  NOT_AVAILABLE = 'Not Available',
  VIEWABLE = 'Viewable',
  DOWNLOADABLE = 'Downloadable',
}

export enum AiAgent {
  NOT_AVAILABLE = 'Not Available',
  AVAILABLE = 'Available',
  INCLUDED = 'Included',
}

export enum SubscriptionPlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Table({
  tableName: 'subscription_plans',
  timestamps: true,
  underscored: true,
})
export class SubscriptionPlan extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Index
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  product_limit: number;

  @Column({
    type: DataType.ENUM(...Object.values(RfqLimit)),
    allowNull: false,
  })
  rfq_limit: RfqLimit;

  @Column({
    type: DataType.ENUM(...Object.values(SearchVisibility)),
    allowNull: false,
  })
  search_visibility: SearchVisibility;

  @Column({
    type: DataType.ENUM(...Object.values(MicroFairPriority)),
    allowNull: false,
  })
  micro_fair_priority: MicroFairPriority;

  @Column({
    type: DataType.ENUM(...Object.values(TrustBadge)),
    allowNull: false,
  })
  trust_badge: TrustBadge;

  @Column({
    type: DataType.ENUM(...Object.values(Verification)),
    allowNull: false,
  })
  verification: Verification;

  @Column({
    type: DataType.ENUM(...Object.values(ProfilePageType)),
    allowNull: false,
  })
  profile_page_type: ProfilePageType;

  @Column({
    type: DataType.ENUM(...Object.values(PdfBrochure)),
    allowNull: false,
  })
  pdf_brochure: PdfBrochure;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  video_access: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  whatsapp_chat: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(AiAgent)),
    allowNull: false,
  })
  ai_agent: AiAgent;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  price: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  })
  duration_in_days: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  rfq_limited_vendor_count: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  rfq_medium_vendor_count: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
    },
  })
  rfq_high_vendor_count: number;

  @Column({
    type: DataType.ENUM(...Object.values(SubscriptionPlanStatus)),
    defaultValue: SubscriptionPlanStatus.ACTIVE,
  })
  status: SubscriptionPlanStatus;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  created_by: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  updated_by: number;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}