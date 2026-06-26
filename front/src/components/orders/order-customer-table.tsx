import { useMemo } from 'react'

import {
  BORDERLESS_TABLE_CLASS,
  TABLE_FILTER_CELL_CLASS,
  TABLE_FILTER_FIELD_CLASS,
} from '@/components/shared/table-filter-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { UzbekPhoneInput } from '@/components/ui/uzbek-phone-input'
import {
  getDistrictsByRegionName,
  UZBEKISTAN_REGIONS,
  withLegacyOption,
} from '@/lib/uzbekistan-regions'
import type { OrderCustomerInfo } from '@/types/order.types'

const EMPTY_SELECT_VALUE = '__empty__'

const CUSTOMER_FIELDS = [
  { key: 'name', label: 'Mijoz ismi', type: 'text' },
  { key: 'phone', label: 'Mijoz raqami', type: 'phone' },
  { key: 'region', label: 'Viloyat', type: 'region' },
  { key: 'district', label: 'Tuman', type: 'district' },
  { key: 'address', label: 'Mijoz manzili', type: 'textarea' },
  { key: 'comment', label: 'Buyurtmaga izoh', type: 'textarea' },
] as const

interface OrderCustomerTableProps {
  customer: OrderCustomerInfo
  disabled?: boolean
  onChange: (patch: Partial<OrderCustomerInfo>) => void
}

export function OrderCustomerTable({
  customer,
  disabled = false,
  onChange,
}: OrderCustomerTableProps) {
  const regionOptions = useMemo(
    () =>
      withLegacyOption(
        UZBEKISTAN_REGIONS.map((region) => region.name),
        customer.region,
      ),
    [customer.region],
  )

  const districtOptions = useMemo(() => {
    const districts = getDistrictsByRegionName(customer.region).map(
      (district) => district.name,
    )
    return withLegacyOption(districts, customer.district)
  }, [customer.region, customer.district])

  const handleRegionChange = (value: string) => {
    const region = value === EMPTY_SELECT_VALUE ? '' : value
    const validDistricts = getDistrictsByRegionName(region).map(
      (district) => district.name,
    )
    const districtStillValid = validDistricts.includes(customer.district)

    onChange({
      region,
      ...(districtStillValid ? {} : { district: '' }),
    })
  }

  return (
    <Table className={BORDERLESS_TABLE_CLASS}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[42%]">Maydon</TableHead>
          <TableHead>Qiymat</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {CUSTOMER_FIELDS.map((field) => (
          <TableRow key={field.key} className="hover:bg-muted/30">
            <TableCell className="font-medium whitespace-nowrap">
              {field.label}
            </TableCell>
            <TableCell className={TABLE_FILTER_CELL_CLASS}>
              {field.type === 'phone' ? (
                <UzbekPhoneInput
                  id={`customer-${field.key}`}
                  value={customer.phone}
                  disabled={disabled}
                  className={TABLE_FILTER_FIELD_CLASS}
                  onChange={(phone) => onChange({ phone })}
                />
              ) : field.type === 'region' ? (
                <Select
                  value={customer.region || EMPTY_SELECT_VALUE}
                  onValueChange={handleRegionChange}
                  disabled={disabled}
                >
                  <SelectTrigger
                    id={`customer-${field.key}`}
                    size="sm"
                    className={TABLE_FILTER_FIELD_CLASS}
                    aria-label="Viloyatni tanlang"
                  >
                    <SelectValue placeholder="Viloyatni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_SELECT_VALUE}>
                      Viloyatni tanlang
                    </SelectItem>
                    {regionOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'district' ? (
                <Select
                  value={customer.district || EMPTY_SELECT_VALUE}
                  onValueChange={(value) =>
                    onChange({
                      district: value === EMPTY_SELECT_VALUE ? '' : value,
                    })
                  }
                  disabled={disabled || !customer.region}
                >
                  <SelectTrigger
                    id={`customer-${field.key}`}
                    size="sm"
                    className={TABLE_FILTER_FIELD_CLASS}
                    aria-label="Tumanni tanlang"
                  >
                    <SelectValue
                      placeholder={
                        customer.region
                          ? 'Tumanni tanlang'
                          : 'Avval viloyatni tanlang'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_SELECT_VALUE}>
                      Tumanni tanlang
                    </SelectItem>
                    {districtOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  id={`customer-${field.key}`}
                  value={customer[field.key]}
                  disabled={disabled}
                  className="min-h-16 text-xs"
                  rows={field.key === 'address' ? 2 : 2}
                  onChange={(e) => onChange({ [field.key]: e.target.value })}
                />
              ) : (
                <Input
                  id={`customer-${field.key}`}
                  value={customer[field.key]}
                  disabled={disabled}
                  className={TABLE_FILTER_FIELD_CLASS}
                  onChange={(e) => onChange({ [field.key]: e.target.value })}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
