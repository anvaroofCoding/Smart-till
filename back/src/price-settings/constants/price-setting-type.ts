export enum PriceSettingType {
  CATEGORY = 'category',
  BRAND = 'brand',
  PRODUCT = 'product',
}

export enum PriceSettingMode {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export const PRICE_SETTING_TYPES = Object.values(PriceSettingType);
export const PRICE_SETTING_MODES = Object.values(PriceSettingMode);
