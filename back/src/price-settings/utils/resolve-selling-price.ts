import {
  PriceSettingMode,
  PriceSettingType,
} from '../constants/price-setting-type';
import { DEFAULT_MARKUP_PERCENT } from '../constants/default-markup';

export type PriceSource =
  | 'product_fixed'
  | 'product_percentage'
  | 'brand'
  | 'category'
  | 'default'
  | 'none';

export interface ResolvedSellingPrice {
  sellingPrice: number;
  markupPercent?: number;
  priceSource: PriceSource;
  priceSettingId?: string;
}

export interface PriceSettingLike {
  id: string;
  settingType: PriceSettingType;
  mode: PriceSettingMode;
  percentage?: number;
  fixedPrice?: number;
  warehouseId?: string | null;
  categoryId?: string;
  brandId?: string;
  productId?: string;
  isActive: boolean;
}

export interface SellingPriceContext {
  warehouseId: string;
  productId: string;
  categoryId: string;
  brandId: string;
  costPrice: number;
}

function applyPercentage(costPrice: number, percentage: number): number {
  return Math.round(costPrice * (1 + percentage / 100));
}

function pickSetting(
  settings: PriceSettingLike[],
  contextWarehouseId: string,
  predicate: (setting: PriceSettingLike) => boolean,
): PriceSettingLike | undefined {
  const specific = settings.find(
    (setting) =>
      setting.warehouseId === contextWarehouseId && predicate(setting),
  );
  if (specific) {
    return specific;
  }

  return settings.find(
    (setting) => !setting.warehouseId && predicate(setting),
  );
}

export function resolveSellingPrice(
  context: SellingPriceContext,
  settings: PriceSettingLike[],
  defaultMarkupPercent: number = DEFAULT_MARKUP_PERCENT,
): ResolvedSellingPrice {
  const { warehouseId, productId, categoryId, brandId, costPrice } = context;

  const productSetting = pickSetting(
    settings,
    warehouseId,
    (setting) =>
      setting.isActive &&
      setting.settingType === PriceSettingType.PRODUCT &&
      setting.productId === productId,
  );

  if (productSetting) {
    if (
      productSetting.mode === PriceSettingMode.FIXED &&
      productSetting.fixedPrice !== undefined
    ) {
      return {
        sellingPrice: productSetting.fixedPrice,
        priceSource: 'product_fixed',
        priceSettingId: productSetting.id,
      };
    }

    if (
      productSetting.mode === PriceSettingMode.PERCENTAGE &&
      productSetting.percentage !== undefined
    ) {
      return {
        sellingPrice: applyPercentage(costPrice, productSetting.percentage),
        markupPercent: productSetting.percentage,
        priceSource: 'product_percentage',
        priceSettingId: productSetting.id,
      };
    }
  }

  const brandSetting = pickSetting(
    settings,
    warehouseId,
    (setting) =>
      setting.isActive &&
      setting.settingType === PriceSettingType.BRAND &&
      setting.categoryId === categoryId &&
      setting.brandId === brandId,
  );

  if (brandSetting?.percentage !== undefined) {
    return {
      sellingPrice: applyPercentage(costPrice, brandSetting.percentage),
      markupPercent: brandSetting.percentage,
      priceSource: 'brand',
      priceSettingId: brandSetting.id,
    };
  }

  const categorySetting = pickSetting(
    settings,
    warehouseId,
    (setting) =>
      setting.isActive &&
      setting.settingType === PriceSettingType.CATEGORY &&
      setting.categoryId === categoryId,
  );

  if (categorySetting?.percentage !== undefined) {
    return {
      sellingPrice: applyPercentage(costPrice, categorySetting.percentage),
      markupPercent: categorySetting.percentage,
      priceSource: 'category',
      priceSettingId: categorySetting.id,
    };
  }

  if (costPrice <= 0) {
    return {
      sellingPrice: costPrice,
      priceSource: 'none',
    };
  }

  return {
    sellingPrice: applyPercentage(costPrice, defaultMarkupPercent),
    markupPercent: defaultMarkupPercent,
    priceSource: 'default',
  };
}

export function buildSellingPriceKey(
  warehouseId: string,
  productId: string,
): string {
  return `${warehouseId}:${productId}`;
}
