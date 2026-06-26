import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Order } from '../../orders/schemas/order.schema';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema';

export type SellerCartDocument = HydratedDocument<SellerCart>;

export const SELLER_CART_STATUSES = ['active', 'claimed'] as const;
export type SellerCartStatus = (typeof SELLER_CART_STATUSES)[number];

@Schema({ _id: false })
export class SellerCartItem {
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

  @Prop({ required: true, min: 0 })
  lineTotal: number;
}

export const SellerCartItemSchema =
  SchemaFactory.createForClass(SellerCartItem);

@Schema({ timestamps: true, collection: 'seller_carts' })
export class SellerCart {
  @Prop({ required: true, trim: true })
  cardNumber: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  sellerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Warehouse.name })
  warehouseId?: Types.ObjectId;

  @Prop({ type: [SellerCartItemSchema], default: [] })
  items: SellerCartItem[];

  @Prop({ required: true, enum: SELLER_CART_STATUSES, default: 'active' })
  status: SellerCartStatus;

  @Prop({ type: Types.ObjectId, ref: Order.name })
  claimedOrderId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SellerCartSchema = SchemaFactory.createForClass(SellerCart);

SellerCartSchema.index(
  { cardNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' },
  },
);
SellerCartSchema.index({ sellerId: 1, status: 1, updatedAt: -1 });
