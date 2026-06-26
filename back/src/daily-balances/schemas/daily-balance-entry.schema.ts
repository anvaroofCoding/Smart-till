import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  PAYMENT_CHANNELS,
  type PaymentChannel,
} from '../constants/payment-channel';
import { ExpenseCategory } from '../../expense-categories/schemas/expense-category.schema';
import { Order } from '../../orders/schemas/order.schema';
import { User } from '../../users/schemas/user.schema';
import { DailyBalance } from './daily-balance.schema';

export type DailyBalanceEntryDocument = HydratedDocument<DailyBalanceEntry>;

export const DAILY_BALANCE_ENTRY_TYPES = [
  'sale',
  'manual_income',
  'expense',
  'cash_to_main',
] as const;
export type DailyBalanceEntryType = (typeof DAILY_BALANCE_ENTRY_TYPES)[number];

@Schema({ timestamps: true, collection: 'daily_balance_entries' })
export class DailyBalanceEntry {
  @Prop({ type: Types.ObjectId, ref: DailyBalance.name, required: true })
  dailyBalanceId: Types.ObjectId;

  @Prop({ required: true, enum: DAILY_BALANCE_ENTRY_TYPES })
  type: DailyBalanceEntryType;

  @Prop({ enum: PAYMENT_CHANNELS })
  channel?: PaymentChannel;

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({ trim: true, default: '' })
  note: string;

  @Prop({ type: Types.ObjectId, ref: ExpenseCategory.name })
  expenseCategoryId?: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  expenseCategoryName: string;

  @Prop({ type: Types.ObjectId, ref: Order.name })
  orderId?: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  orderLabel: string;

  @Prop({ type: Types.ObjectId, ref: User.name })
  createdById?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DailyBalanceEntrySchema =
  SchemaFactory.createForClass(DailyBalanceEntry);

DailyBalanceEntrySchema.index({ dailyBalanceId: 1, createdAt: -1 });
DailyBalanceEntrySchema.index({ type: 1, createdAt: -1 });
DailyBalanceEntrySchema.index({ expenseCategoryId: 1 });
