import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductCategoryDocument = HydratedDocument<ProductCategory>;

@Schema({ timestamps: true, collection: 'product_categories' })
export class ProductCategory {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductCategorySchema =
  SchemaFactory.createForClass(ProductCategory);

ProductCategorySchema.index({ name: 'text', description: 'text' });
ProductCategorySchema.index({ isActive: 1 });
