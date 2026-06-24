import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentType } from '../../payment-types/schemas/payment-type.schema';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';

export type OrderDocument = HydratedDocument<Order>;

export const ORDER_STATUSES = ['draft', 'confirmed', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  productName: string;

  @Prop({ default: '', trim: true })
  productCode: string;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0.001 })
  quantity: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ required: true, min: 0 })
  lineTotal: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class OrderPayment {
  @Prop({ type: Types.ObjectId, ref: PaymentType.name, required: true })
  paymentTypeId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  paymentTypeName: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ min: 1 })
  installmentMonths?: number;

  @Prop({ min: 0, max: 100 })
  installmentInterestPercent?: number;
}

export const OrderPaymentSchema = SchemaFactory.createForClass(OrderPayment);

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ default: '', trim: true })
  customerName: string;

  @Prop({ default: '', trim: true })
  customerPhone: string;

  @Prop({ default: '', trim: true })
  customerRegion: string;

  @Prop({ default: '', trim: true })
  customerDistrict: string;

  @Prop({ default: '', trim: true })
  customerArea: string;

  @Prop({ default: '', trim: true })
  customerAddress: string;

  @Prop({ default: '', trim: true })
  comment: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({ type: [OrderPaymentSchema], default: [] })
  payments: OrderPayment[];

  @Prop({ default: 0, min: 0 })
  itemsCount: number;

  @Prop({ default: 0, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  discountTotal: number;

  @Prop({ default: 0, min: 0 })
  total: number;

  @Prop({ default: 0, min: 0 })
  paidTotal: number;

  @Prop({ default: 0, min: 0 })
  remainingTotal: number;

  @Prop({ required: true, enum: ORDER_STATUSES, default: 'draft' })
  status: OrderStatus;

  @Prop({ type: Types.ObjectId, ref: User.name })
  createdById?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ customerPhone: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
