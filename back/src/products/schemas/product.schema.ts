import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProductBrand } from '../../product-brands/schemas/product-brand.schema';
import { ProductCategory } from '../../product-categories/schemas/product-category.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: '' })
  code: string;

  @Prop({ trim: true, unique: true, sparse: true })
  barcode?: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ type: Types.ObjectId, ref: ProductCategory.name, required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: ProductBrand.name, required: true })
  brandId: Types.ObjectId;

  @Prop({ default: '' })
  image: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text' });
ProductSchema.index({ code: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ brandId: 1 });
ProductSchema.index({ isActive: 1 });
