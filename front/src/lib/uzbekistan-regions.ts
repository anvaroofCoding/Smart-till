import regionsData from '@/data/uzbekistan-regions.json'

export interface UzbekistanRegion {
  id: number
  name: string
}

export interface UzbekistanDistrict {
  id: number
  region_id: number
  name: string
}

export const UZBEKISTAN_REGIONS = regionsData.regions as UzbekistanRegion[]
export const UZBEKISTAN_DISTRICTS = regionsData.districts as UzbekistanDistrict[]

export function getDistrictsByRegionName(regionName: string): UzbekistanDistrict[] {
  const region = UZBEKISTAN_REGIONS.find((item) => item.name === regionName)
  if (!region) return []
  return UZBEKISTAN_DISTRICTS.filter((item) => item.region_id === region.id)
}

export function withLegacyOption(options: string[], currentValue: string): string[] {
  const trimmed = currentValue.trim()
  if (!trimmed || options.includes(trimmed)) return options
  return [trimmed, ...options]
}
