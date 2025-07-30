import { Column, Model, Table, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt, Index } from 'sequelize-typescript';
import { User } from './user.model';
import { BusinessType } from './business-type.model';

@Table({
  tableName: 'vendor_profiles',
  timestamps: true,
  underscored: true,
})
export class VendorProfile extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Index
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id: number;

  @Index
  @ForeignKey(() => BusinessType)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  business_type_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  business_type: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  business_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  company_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contact_person: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  designation: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  country: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  city: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
  })
  website: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  business_registration_certificate: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  gst_number: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  address: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  company_details: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    validate: {
      is: /^[+]?[\d\s\-()]+$/,
    },
  })
  whatsapp_number: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  logo: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  working_days: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
    },
  })
  employee_count: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  payment_mode: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 1900,
      max: new Date().getFullYear(),
    },
  })
  establishment: number;

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

  // Associations
  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => BusinessType)
  linkedBusinessType: BusinessType;
}