export type PriceSettingType = 'category' | 'brand' | 'product'
export type PriceSettingMode = 'percentage' | 'fixed'

export interface PriceSettingRelation {
  id: string
  name: string
}

export interface PriceSettingRecord {
  id: string
  settingType: PriceSettingType
  warehouse: PriceSettingRelation
  category?: PriceSettingRelation
  brand?: PriceSettingRelation
  product?: PriceSettingRelation
  mode: PriceSettingMode
  percentage?: number
  fixedPrice?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const ALL_WAREHOUSES_VALUE = '__all__'

export const ALL_WAREHOUSES_LABEL = 'Barcha filiallar'

export interface CreatePriceSettingRequest {
  settingType: PriceSettingType
  warehouseId?: string
  applyToAllWarehouses?: boolean
  categoryId?: string
  brandId?: string
  productId?: string
  mode: PriceSettingMode
  percentage?: number
  fixedPrice?: number
  isActive?: boolean
}

export type UpdatePriceSettingRequest = Partial<CreatePriceSettingRequest>

export interface PriceSettingsListResponse {
  data: PriceSettingRecord[]
  meta: import('./api.types').PaginatedMeta
}

export const PRICE_SETTING_TYPE_LABELS: Record<PriceSettingType, string> = {
  category: 'Maxsulotlar kategoriyasi',
  brand: 'Maxsulot brendi',
  product: 'Maxsulot',
}

export const PRICE_SETTING_MODE_LABELS: Record<PriceSettingMode, string> = {
  percentage: 'Foiz',
  fixed: 'Qo\'lda narx',
}

export function getPriceSettingTargetLabel(setting: PriceSettingRecord): string {
  if (setting.settingType === 'category') {
    return setting.category?.name ?? '—'
  }
  if (setting.settingType === 'brand') {
    const category = setting.category?.name
    const brand = setting.brand?.name
    if (category && brand) return `${category} / ${brand}`
    return brand ?? category ?? '—'
  }
  return setting.product?.name ?? '—'
}

export function getPriceSettingValueLabel(setting: PriceSettingRecord): string {
  if (setting.mode === 'fixed' && setting.fixedPrice !== undefined) {
    return String(setting.fixedPrice)
  }
  if (setting.percentage !== undefined) {
    return `${setting.percentage}%`
  }
  return '—'
}
