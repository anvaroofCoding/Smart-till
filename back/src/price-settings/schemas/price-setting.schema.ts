import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProductBrand } from '../../product-brands/schemas/product-brand.schema';
import { ProductCategory } from '../../product-categories/schemas/product-category.schema';
import { Product } from '../../products/schemas/product.schema';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema';
import {
  PriceSettingMode,
  PriceSettingType,
} from '../constants/price-setting-type';

export type PriceSettingDocument = HydratedDocument<PriceSetting>;

@Schema({ timestamps: true, collection: 'price_settings' })
export class PriceSetting {
  @Prop({ required: true, enum: PriceSettingType })
  settingType: PriceSettingType;

  @Prop({ type: Types.ObjectId, ref: Warehouse.name, default: null })
  warehouseId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: ProductCategory.name })
  categoryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: ProductBrand.name })
  brandId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Product.name })
  productId?: Types.ObjectId;

  @Prop({ required: true, enum: PriceSettingMode })
  mode: PriceSettingMode;

  @Prop({ min: 0, max: 1000 })
  percentage?: number;

  @Prop({ min: 0 })
  fixedPrice?: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PriceSettingSchema = SchemaFactory.createForClass(PriceSetting);

PriceSettingSchema.index({ warehouseId: 1, settingType: 1, categoryId: 1 });
PriceSettingSchema.index({ warehouseId: 1, settingType: 1, brandId: 1 });
PriceSettingSchema.index({ warehouseId: 1, settingType: 1, productId: 1 });
PriceSettingSchema.index({ isActive: 1 });
PriceSettingSchema.index(
  { warehouseId: 1, settingType: 1, categoryId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      settingType: PriceSettingType.CATEGORY,
      warehouseId: { $type: 'objectId' },
    },
  },
);
PriceSettingSchema.index(
  { settingType: 1, categoryId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      settingType: PriceSettingType.CATEGORY,
      warehouseId: null,
    },
  },
);
PriceSettingSchema.index(
  { warehouseId: 1, settingType: 1, categoryId: 1, brandId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      settingType: PriceSettingType.BRAND,
      warehouseId: { $type: 'objectId' },
    },
  },
);
PriceSettingSchema.index(
  { settingType: 1, categoryId: 1, brandId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      settingType: PriceSettingType.BRAND,
      warehouseId: null,
    },
  },
);
PriceSettingSchema.index(
  { warehouseId: 1, settingType: 1, productId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      settingType: PriceSettingType.PRODUCT,
      warehouseId: { $type: 'objectId' },
    },
  },
);
PriceSettingSchema.index(
  { settingType: 1, productId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      settingType: PriceSettingType.PRODUCT,
      warehouseId: null,
    },
  },
);
