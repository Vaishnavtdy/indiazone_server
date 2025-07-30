import { Column, Model, Table, DataType, HasOne, CreatedAt, UpdatedAt, Index } from "sequelize-typescript";
import { VendorProfile } from "./vendor-profile.model";

export enum UserType {
  VENDOR = "vendor",
  CUSTOMER = "customer",
  ADMIN = "admin",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING = "pending",
}

@Table({
  tableName: "users",
  timestamps: true,
  underscored: true,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.ENUM(...Object.values(UserType)),
    allowNull: false,
  })
  type: UserType;

  @Index
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  aws_cognito_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  first_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  last_name: string;

  @Index
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    validate: {
      is: /^[+]?[\d\s\-()]+$/,
    },
  })
  phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  post_code: string;

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
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_verified: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  verified_at: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_profile_updated: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_profile_reverified: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  profile_reverified_at: Date;

  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    defaultValue: UserStatus.PENDING,
  })
  status: UserStatus;

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

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  remarks: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  rejected_at: Date;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  // Associations
  @HasOne(() => VendorProfile)
  vendor_profile: VendorProfile;
}
