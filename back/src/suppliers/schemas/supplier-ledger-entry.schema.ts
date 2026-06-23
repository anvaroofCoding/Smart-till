import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Supplier } from './supplier.schema';

export type SupplierLedgerEntryDocument = HydratedDocument<SupplierLedgerEntry>;

export const SUPPLIER_LEDGER_TYPES = ['payment', 'debt'] as const;
export type SupplierLedgerType = (typeof SUPPLIER_LEDGER_TYPES)[number];

@Schema({ timestamps: true, collection: 'supplier_ledger_entries' })
export class SupplierLedgerEntry {
  @Prop({ type: Types.ObjectId, ref: Supplier.name, required: true, index: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true, enum: SUPPLIER_LEDGER_TYPES })
  type: SupplierLedgerType;

  @Prop({ required: true })
  entryNumber: number;

  @Prop({ default: 0 })
  amountUzs: number;

  @Prop({ default: 0 })
  amountUsd: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SupplierLedgerEntrySchema =
  SchemaFactory.createForClass(SupplierLedgerEntry);

SupplierLedgerEntrySchema.index({ supplierId: 1, entryNumber: 1 }, { unique: true });
SupplierLedgerEntrySchema.index({ supplierId: 1, createdAt: -1 });
