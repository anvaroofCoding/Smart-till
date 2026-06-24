import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema';

export type WarehouseStockDocument = HydratedDocument<WarehouseStock>;

@Schema({ timestamps: true, collection: 'warehouse_stocks' })
export class WarehouseStock {
  @Prop({ type: Types.ObjectId, ref: Warehouse.name, required: true })
  warehouseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  productId: Types.ObjectId;

  @Prop({ default: 0, min: 0 })
  quantity: number;

  @Prop({ default: 0, min: 0 })
  lastUnitPrice: number;

  @Prop({ default: 1, min: 0.0001 })
  lastExchangeRate: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WarehouseStockSchema =
  SchemaFactory.createForClass(WarehouseStock);

WarehouseStockSchema.index({ warehouseId: 1, productId: 1 }, { unique: true });
WarehouseStockSchema.index({ warehouseId: 1 });
WarehouseStockSchema.index({ productId: 1 });
