import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema';

export type DailyBalanceDocument = HydratedDocument<DailyBalance>;

export const DAILY_BALANCE_STATUSES = ['open', 'closed'] as const;
export type DailyBalanceStatus = (typeof DAILY_BALANCE_STATUSES)[number];

@Schema({ timestamps: true, collection: 'daily_balances' })
export class DailyBalance {
  @Prop({ required: true, trim: true })
  dateKey: string;

  @Prop({ type: Types.ObjectId, ref: Warehouse.name, required: true })
  warehouseId: Types.ObjectId;

  @Prop({
    required: true,
    enum: DAILY_BALANCE_STATUSES,
    default: 'open',
  })
  status: DailyBalanceStatus;

  @Prop({ default: 0, min: 0 })
  salesCash: number;

  @Prop({ default: 0, min: 0 })
  salesTerminal: number;

  @Prop({ default: 0, min: 0 })
  salesCard: number;

  @Prop({ default: 0, min: 0 })
  manualIncomeCash: number;

  @Prop({ default: 0, min: 0 })
  manualIncomeTerminal: number;

  @Prop({ default: 0, min: 0 })
  manualIncomeCard: number;

  @Prop({ default: 0, min: 0 })
  expenseTotal: number;

  @Prop()
  closedAt?: Date;

  @Prop({ default: 0, min: 0 })
  transferredToMain: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DailyBalanceSchema = SchemaFactory.createForClass(DailyBalance);

DailyBalanceSchema.index({ dateKey: 1, warehouseId: 1 }, { unique: true });
DailyBalanceSchema.index({ status: 1, dateKey: -1 });
DailyBalanceSchema.index({ warehouseId: 1, dateKey: -1 });
