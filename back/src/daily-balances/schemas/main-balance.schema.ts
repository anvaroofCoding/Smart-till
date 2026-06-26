import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DailyBalance } from './daily-balance.schema';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema';

export type MainBalanceDocument = HydratedDocument<MainBalance>;
export type MainBalanceTransferDocument =
  HydratedDocument<MainBalanceTransfer>;

@Schema({ timestamps: true, collection: 'main_balance' })
export class MainBalance {
  @Prop({ default: 0, min: 0 })
  total: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MainBalanceSchema = SchemaFactory.createForClass(MainBalance);

@Schema({ timestamps: true, collection: 'main_balance_transfers' })
export class MainBalanceTransfer {
  @Prop({ type: Types.ObjectId, ref: DailyBalance.name, required: true })
  dailyBalanceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Warehouse.name, required: true })
  warehouseId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  dateKey: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, min: 0 })
  mainBalanceBefore: number;

  @Prop({ required: true, min: 0 })
  mainBalanceAfter: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MainBalanceTransferSchema =
  SchemaFactory.createForClass(MainBalanceTransfer);

MainBalanceTransferSchema.index({ createdAt: -1 });
MainBalanceTransferSchema.index({ dailyBalanceId: 1, createdAt: -1 });
