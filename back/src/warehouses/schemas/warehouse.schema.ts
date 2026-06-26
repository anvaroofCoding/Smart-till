import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WarehouseDocument = HydratedDocument<Warehouse>;

@Schema({ timestamps: true, collection: 'warehouses' })
export class Warehouse {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ trim: true, default: '' })
  address: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0, min: 0 })
  dailySalesPlan: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);

WarehouseSchema.index({ name: 'text', address: 'text', description: 'text' });
WarehouseSchema.index({ isActive: 1 });
