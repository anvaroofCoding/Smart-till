import { Types } from 'mongoose';
import { PriceSettingResponseDto } from './dto/price-setting.dto';
import { PriceSettingDocument } from './schemas/price-setting.schema';

type PopulatedRelation =
  | Types.ObjectId
  | { _id: Types.ObjectId; name: string };

function resolveRelation(
  value?: PopulatedRelation | null,
): { id: string; name: string } | undefined {
  if (!value) return undefined;

  if (typeof value === 'object' && 'name' in value) {
    return {
      id: value._id.toString(),
      name: value.name,
    };
  }

  return {
    id: (value as Types.ObjectId).toString(),
    name: '',
  };
}

export function toPriceSettingResponse(
  setting: PriceSettingDocument,
): PriceSettingResponseDto {
  return {
    id: setting._id.toString(),
    settingType: setting.settingType,
    warehouse: setting.warehouseId
      ? resolveRelation(setting.warehouseId as PopulatedRelation)!
      : { id: '', name: 'Barcha filiallar' },
    category: resolveRelation(setting.categoryId as PopulatedRelation),
    brand: resolveRelation(setting.brandId as PopulatedRelation),
    product: resolveRelation(setting.productId as PopulatedRelation),
    mode: setting.mode,
    percentage: setting.percentage,
    fixedPrice: setting.fixedPrice,
    isActive: setting.isActive,
    createdAt: setting.createdAt!,
    updatedAt: setting.updatedAt!,
  };
}

export function toPriceSettingLike(setting: PriceSettingDocument) {
  return {
    id: setting._id.toString(),
    settingType: setting.settingType,
    mode: setting.mode,
    percentage: setting.percentage,
    fixedPrice: setting.fixedPrice,
    warehouseId: setting.warehouseId?.toString() ?? null,
    categoryId: setting.categoryId?.toString(),
    brandId: setting.brandId?.toString(),
    productId: setting.productId?.toString(),
    isActive: setting.isActive,
  };
}
