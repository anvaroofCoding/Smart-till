import {
  ALL_WAREHOUSES_VALUE,
  type PriceSettingType,
} from '@/types/price-setting.types'

export interface PriceSettingTableFilters {
  id: string
  settingType: 'all' | PriceSettingType
  warehouseId: string
  targetName: string
  percentage: string
  status: 'all' | 'active' | 'inactive'
  createdAt: string
}

export const emptyPriceSettingTableFilters: PriceSettingTableFilters = {
  id: '',
  settingType: 'all',
  warehouseId: '',
  targetName: '',
  percentage: '',
  status: 'all',
  createdAt: '',
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.replace(/\s/g, '').replace(',', '.').trim()
  if (!normalized) return undefined

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function priceSettingFiltersToQueryParams(
  filters: PriceSettingTableFilters,
): Record<string, string | number | boolean | undefined> {
  return {
    id: filters.id.trim() || undefined,
    settingType:
      filters.settingType === 'all' ? undefined : filters.settingType,
    warehouseId:
      filters.warehouseId && filters.warehouseId !== ALL_WAREHOUSES_VALUE
        ? filters.warehouseId
        : undefined,
    allWarehouses: filters.warehouseId === ALL_WAREHOUSES_VALUE || undefined,
    search: filters.targetName.trim() || undefined,
    percentage: parseOptionalNumber(filters.percentage),
    isActive:
      filters.status === 'all'
        ? undefined
        : filters.status === 'active',
    createdAt: filters.createdAt.trim() || undefined,
  }
}

export const PRICE_SETTING_TABLE_HEADERS = [
  '№',
  'ID',
  'Sozlama turi',
  'Filial',
  'Belgilovchi',
  'Foiz / Narx',
  'Holat',
  'Saqlangan vaqti',
  'Amallar',
] as const
