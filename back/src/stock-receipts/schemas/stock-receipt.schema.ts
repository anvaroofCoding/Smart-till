import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { Supplier } from '../../suppliers/schemas/supplier.schema';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema';
import {
  RECEIPT_PAYMENT_TYPES,
  type ReceiptPaymentType,
} from '../constants/receipt-payment-types';
import {
  RECEIPT_STATUSES,
  type ReceiptStatus,
} from '../constants/receipt-status';

export type StockReceiptDocument = HydratedDocument<StockReceipt>;

@Schema({ _id: true })
export class StockReceiptItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  productName: string;

  @Prop({ required: true, min: 0.001 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;
}

export const StockReceiptItemSchema =
  SchemaFactory.createForClass(StockReceiptItem);

@Schema({ timestamps: true, collection: 'stock_receipts' })
export class StockReceipt {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    type: String,
    enum: RECEIPT_PAYMENT_TYPES,
    required: true,
  })
  paymentType: ReceiptPaymentType;

  @Prop({ type: Types.ObjectId, ref: Supplier.name, required: true })
  supplierId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Warehouse.name, required: true })
  warehouseId: Types.ObjectId;

  @Prop({ required: true, min: 0.0001 })
  exchangeRate: number;

  @Prop({ default: '', trim: true })
  notes: string;

  @Prop({
    type: String,
    enum: RECEIPT_STATUSES,
    default: 'in_progress',
  })
  status: ReceiptStatus;

  @Prop({ type: [StockReceiptItemSchema], default: [] })
  items: StockReceiptItem[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const StockReceiptSchema = SchemaFactory.createForClass(StockReceipt);

StockReceiptSchema.index({ name: 'text', notes: 'text' });
StockReceiptSchema.index({ status: 1 });
StockReceiptSchema.index({ supplierId: 1 });
StockReceiptSchema.index({ warehouseId: 1 });
StockReceiptSchema.index({ createdAt: -1 });
