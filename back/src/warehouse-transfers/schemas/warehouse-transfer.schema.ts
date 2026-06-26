import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema';
import {
  TRANSFER_STATUSES,
  type TransferStatus,
} from '../constants/transfer-status';

export type WarehouseTransferDocument = HydratedDocument<WarehouseTransfer>;

@Schema({ _id: true })
export class WarehouseTransferItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  productName: string;

  @Prop({ required: true, min: 0.001 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ min: 0 })
  receivedQuantity?: number;

  @Prop({ default: false })
  receivedMarked?: boolean;
}

export const WarehouseTransferItemSchema =
  SchemaFactory.createForClass(WarehouseTransferItem);

@Schema({ timestamps: true, collection: 'warehouse_transfers' })
export class WarehouseTransfer {
  @Prop({ required: true, trim: true, unique: true })
  code: string;

  @Prop({ trim: true, default: '' })
  name: string;

  @Prop({ type: Types.ObjectId, ref: Warehouse.name, required: true })
  fromWarehouseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Warehouse.name })
  toWarehouseId?: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  transferDate: string;

  @Prop({
    type: String,
    enum: TRANSFER_STATUSES,
    default: 'draft',
  })
  status: TransferStatus;

  @Prop({ type: [WarehouseTransferItemSchema], default: [] })
  items: WarehouseTransferItem[];

  @Prop({ trim: true, default: '' })
  notes: string;

  @Prop({ type: Types.ObjectId, ref: User.name })
  createdByUserId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  sentByUserId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  acceptedByUserId?: Types.ObjectId;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WarehouseTransferSchema =
  SchemaFactory.createForClass(WarehouseTransfer);

WarehouseTransferSchema.index({ status: 1, createdAt: -1 });
WarehouseTransferSchema.index({ fromWarehouseId: 1, createdByUserId: 1, status: 1 });
WarehouseTransferSchema.index({ fromWarehouseId: 1, createdAt: -1 });
WarehouseTransferSchema.index({ toWarehouseId: 1, createdAt: -1 });
WarehouseTransferSchema.index({ transferDate: 1 });
