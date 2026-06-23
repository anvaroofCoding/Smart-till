import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../common/constants/roles';
import { UserPosition } from '../../common/constants/positions';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  login: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ min: 0, max: 120, default: 0 })
  age: number;

  @Prop({ type: Date })
  birthDate?: Date;

  @Prop({ required: true, enum: UserPosition, default: UserPosition.KASSIR })
  position: UserPosition;

  @Prop({ type: [String], default: [] })
  allowedPages: string[];

  @Prop({ default: false })
  allWarehouses: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: Warehouse.name }], default: [] })
  warehouseIds: Types.ObjectId[];

  @Prop({ required: true, enum: UserRole, default: UserRole.SCANNER })
  role: UserRole;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1 });
UserSchema.index({ position: 1 });

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
