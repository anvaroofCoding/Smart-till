import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Product } from './product.schema';

export type ProductBarcodeDocument = HydratedDocument<ProductBarcode>;

export const PRODUCT_BARCODE_SOURCES = ['system', 'manual'] as const;
export type ProductBarcodeSource = (typeof PRODUCT_BARCODE_SOURCES)[number];

@Schema({ timestamps: true, collection: 'product_barcodes' })
export class ProductBarcode {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ required: true, trim: true, unique: true })
  value: string;

  @Prop({
    type: String,
    enum: PRODUCT_BARCODE_SOURCES,
    default: 'system',
  })
  source: ProductBarcodeSource;

  @Prop({ default: false })
  isPrimary: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductBarcodeSchema = SchemaFactory.createForClass(ProductBarcode);

ProductBarcodeSchema.index({ productId: 1, isPrimary: 1 });
