import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { Supplier } from '../../suppliers/schemas/supplier.schema';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema';
import {
  STOCK_MOVEMENT_SOURCES,
  type StockMovementSource,
} from '../constants/stock-movement-source';

export type StockMovementDocument = HydratedDocument<StockMovement>;

@Schema({ timestamps: true, collection: 'stock_movements' })
export class StockMovement {
  @Prop({ type: Types.ObjectId, ref: Warehouse.name, required: true })
  warehouseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  delta: number;

  @Prop({ required: true, min: 0 })
  balanceAfter: number;

  @Prop({
    type: String,
    enum: STOCK_MOVEMENT_SOURCES,
    required: true,
  })
  sourceType: StockMovementSource;

  @Prop({ type: Types.ObjectId, required: true })
  sourceId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  sourceName: string;

  @Prop({ type: Types.ObjectId, ref: Supplier.name })
  supplierId?: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  supplierName: string;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0.0001 })
  exchangeRate: number;

  @Prop({ trim: true, default: '' })
  notes: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);

StockMovementSchema.index({ warehouseId: 1, productId: 1, createdAt: -1 });
StockMovementSchema.index({ sourceType: 1, sourceId: 1 });
