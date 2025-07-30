import { Column, Model, Table, DataType, CreatedAt, UpdatedAt, Index, HasMany } from 'sequelize-typescript';
import { VendorProfile } from './vendor-profile.model';

export enum BusinessTypeStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

export enum BusinessTypeCreatedBy {
  ADMIN = 'admin',
}

@Table({
  tableName: 'business_types',
  timestamps: true,
  underscored: true,
})
export class BusinessType extends Model {
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
  business_type: string;

  @Column({
    type: DataType.BIGINT,
    defaultValue: BusinessTypeStatus.ACTIVE,
    validate: {
      isIn: [[BusinessTypeStatus.INACTIVE, BusinessTypeStatus.ACTIVE]],
    },
  })
  status: BusinessTypeStatus;

  @Column({
    type: DataType.ENUM(...Object.values(BusinessTypeCreatedBy)),
    allowNull: false,
  })
  created_by: BusinessTypeCreatedBy;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  // Associations
  @HasMany(() => VendorProfile)
  vendor_profiles: VendorProfile[];
}