import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductBrandDocument = HydratedDocument<ProductBrand>;

@Schema({ timestamps: true, collection: 'product_brands' })
export class ProductBrand {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductBrandSchema = SchemaFactory.createForClass(ProductBrand);

ProductBrandSchema.index({ name: 'text', description: 'text' });
ProductBrandSchema.index({ isActive: 1 });
