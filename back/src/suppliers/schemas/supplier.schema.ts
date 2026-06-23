import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  DEFAULT_SUPPLIER_CURRENCY,
  SUPPLIER_CURRENCIES,
} from '../../common/constants/currency';

type SupplierCurrency = (typeof SUPPLIER_CURRENCIES)[number];

export type SupplierDocument = HydratedDocument<Supplier>;

@Schema({ timestamps: true, collection: 'suppliers' })
export class Supplier {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '', trim: true })
  officialName: string;

  @Prop({ default: '', trim: true })
  phone: string;

  @Prop({ default: '', trim: true })
  address: string;

  @Prop({ default: '', trim: true })
  comment: string;

  @Prop({
    type: String,
    enum: ['UZS', 'USD', 'EUR', 'RUB', 'CNY'],
    default: DEFAULT_SUPPLIER_CURRENCY,
  })
  currency: SupplierCurrency;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

SupplierSchema.index({ name: 'text', officialName: 'text', phone: 'text' });
SupplierSchema.index({ isActive: 1 });
SupplierSchema.index({ currency: 1 });
