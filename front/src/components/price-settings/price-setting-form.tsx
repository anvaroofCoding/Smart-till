import { useMemo, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import type { ProductBrandRecord } from '@/types/product-brand.types'
import type { ProductCategoryRecord } from '@/types/product-category.types'
import type { ProductRecord } from '@/types/product.types'
import {
  ALL_WAREHOUSES_LABEL,
  ALL_WAREHOUSES_VALUE,
  PRICE_SETTING_TYPE_LABELS,
  type CreatePriceSettingRequest,
  type PriceSettingMode,
  type PriceSettingRecord,
  type PriceSettingType,
} from '@/types/price-setting.types'
import type { WarehouseRecord } from '@/types/warehouse.types'
import { DEFAULT_MARKUP_PERCENT } from '@/config/pricing'

export type PriceSettingFormValues = CreatePriceSettingRequest

export const emptyPriceSettingForm: PriceSettingFormValues = {
  settingType: 'category',
  warehouseId: '',
  categoryId: '',
  brandId: '',
  productId: '',
  mode: 'percentage',
  percentage: undefined,
  fixedPrice: undefined,
  isActive: true,
}

export function priceSettingToFormValues(
  setting: PriceSettingRecord,
): PriceSettingFormValues {
  const isAllWarehouses =
    !setting.warehouse.id || setting.warehouse.name === ALL_WAREHOUSES_LABEL

  return {
    settingType: setting.settingType,
    warehouseId: isAllWarehouses ? ALL_WAREHOUSES_VALUE : setting.warehouse.id,
    categoryId: setting.category?.id ?? '',
    brandId: setting.brand?.id ?? '',
    productId: setting.product?.id ?? '',
    mode: setting.mode,
    percentage: setting.percentage,
    fixedPrice: setting.fixedPrice,
    isActive: setting.isActive,
  }
}

export function validatePriceSettingForm(
  values: PriceSettingFormValues,
): string | null {
  if (!values.warehouseId) {
    return 'Filialni tanlang'
  }

  if (values.settingType === 'category') {
    if (!values.categoryId) return 'Kategoriyani tanlang'
    if (values.percentage === undefined || values.percentage < 0) {
      return 'Foizni kiriting'
    }
    return null
  }

  if (values.settingType === 'brand') {
    if (!values.categoryId) return 'Kategoriyani tanlang'
    if (!values.brandId) return 'Brendni tanlang'
    if (values.percentage === undefined || values.percentage < 0) {
      return 'Foizni kiriting'
    }
    return null
  }

  if (!values.productId) return 'Maxsulotni tanlang'

  if (values.mode === 'fixed') {
    if (values.fixedPrice === undefined || values.fixedPrice < 0) {
      return 'Sotuv narxini kiriting'
    }
    return null
  }

  if (values.percentage === undefined || values.percentage < 0) {
    return 'Foizni kiriting'
  }

  return null
}

export function buildPriceSettingPayload(
  values: PriceSettingFormValues,
): CreatePriceSettingRequest {
  const applyToAllWarehouses = values.warehouseId === ALL_WAREHOUSES_VALUE

  return {
    ...values,
    warehouseId: applyToAllWarehouses ? undefined : values.warehouseId,
    applyToAllWarehouses,
    categoryId: values.categoryId || undefined,
    brandId: values.brandId || undefined,
    productId: values.productId || undefined,
  }
}

export function canSubmitPriceSettingForm(values: PriceSettingFormValues): boolean {
  return validatePriceSettingForm(values) === null
}

interface PriceSettingFormProps {
  mode: 'create' | 'edit'
  initialValues: PriceSettingFormValues
  warehouses: WarehouseRecord[]
  categories: ProductCategoryRecord[]
  brands: ProductBrandRecord[]
  products: ProductRecord[]
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: PriceSettingFormValues) => void | Promise<void>
  onCancel: () => void
}

export function PriceSettingForm({
  mode,
  initialValues,
  warehouses,
  categories,
  brands,
  products,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: PriceSettingFormProps) {
  const [values, setValues] = useState<PriceSettingFormValues>(initialValues)
  const [validationError, setValidationError] = useState<string | null>(null)

  const filteredBrands = useMemo(() => {
    if (values.settingType === 'brand' || !values.categoryId) {
      return brands
    }

    const brandIds = new Set(
      products
        .filter((product) => product.category.id === values.categoryId)
        .map((product) => product.brand.id),
    )

    return brands.filter((brand) => brandIds.has(brand.id))
  }, [brands, products, values.categoryId, values.settingType])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (values.categoryId && product.category.id !== values.categoryId) {
        return false
      }
      if (values.brandId && product.brand.id !== values.brandId) {
        return false
      }
      return true
    })
  }, [products, values.categoryId, values.brandId])

  function updateValues(patch: Partial<PriceSettingFormValues>) {
    setValues((prev) => {
      const next = { ...prev, ...patch }

      if (patch.settingType) {
        if (patch.settingType === 'category') {
          next.mode = 'percentage'
          next.brandId = ''
          next.productId = ''
          next.fixedPrice = undefined
        } else if (patch.settingType === 'brand') {
          next.mode = 'percentage'
          next.productId = ''
          next.fixedPrice = undefined
        }
      }

      if (patch.categoryId !== undefined && patch.categoryId !== prev.categoryId) {
        next.brandId = ''
        next.productId = ''
      }

      if (patch.brandId !== undefined && patch.brandId !== prev.brandId) {
        next.productId = ''
      }

      return next
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const message = validatePriceSettingForm(values)
    if (message) {
      setValidationError(message)
      return
    }
    setValidationError(null)
    await onSubmit(values)
  }

  const displayError = validationError ?? error
  const showPercentage =
    values.settingType !== 'product' || values.mode === 'percentage'
  const showFixedPrice =
    values.settingType === 'product' && values.mode === 'fixed'

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Asosiy ma&apos;lumotlar</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Sozlama turi</FieldLabel>
              <Select
                value={values.settingType}
                onValueChange={(settingType: PriceSettingType) =>
                  updateValues({ settingType })
                }
                disabled={mode === 'edit' || isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRICE_SETTING_TYPE_LABELS) as PriceSettingType[]).map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {PRICE_SETTING_TYPE_LABELS[type]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Filial (ombor)</FieldLabel>
              <Select
                value={values.warehouseId || undefined}
                onValueChange={(warehouseId) => updateValues({ warehouseId })}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filialni tanlang" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-50">
                  <SelectItem value={ALL_WAREHOUSES_VALUE}>
                    {ALL_WAREHOUSES_LABEL}
                  </SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {(values.settingType === 'category' ||
              values.settingType === 'brand') && (
              <Field>
                <FieldLabel>Kategoriya</FieldLabel>
                <Select
                  value={values.categoryId || undefined}
                  onValueChange={(categoryId) => updateValues({ categoryId })}
                  disabled={isSaving || categories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        categories.length === 0
                          ? 'Kategoriyalar yuklanmoqda...'
                          : 'Kategoriyani tanlang'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-50">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {values.settingType === 'brand' && (
              <Field>
                <FieldLabel>Brend</FieldLabel>
                <Select
                  value={values.brandId || undefined}
                  onValueChange={(brandId) => updateValues({ brandId })}
                  disabled={!values.categoryId || isSaving || brands.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !values.categoryId
                          ? 'Avval kategoriyani tanlang'
                          : brands.length === 0
                            ? 'Brendlar yuklanmoqda...'
                            : 'Brendni tanlang'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-50">
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {values.settingType === 'product' && (
              <>
                <Field>
                  <FieldLabel>Kategoriya (ixtiyoriy filter)</FieldLabel>
                  <Select
                    value={values.categoryId || 'all'}
                    onValueChange={(categoryId) =>
                      updateValues({
                        categoryId: categoryId === 'all' ? '' : categoryId,
                      })
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Barchasi" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-50">
                      <SelectItem value="all">Barchasi</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Brend (ixtiyoriy filter)</FieldLabel>
                  <Select
                    value={values.brandId || 'all'}
                    onValueChange={(brandId) =>
                      updateValues({
                        brandId: brandId === 'all' ? '' : brandId,
                      })
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Barchasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      {filteredBrands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Maxsulot</FieldLabel>
                  <Select
                    value={values.productId || undefined}
                    onValueChange={(productId) => updateValues({ productId })}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Maxsulotni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Narx usuli</FieldLabel>
                  <Select
                    value={values.mode}
                    onValueChange={(mode: PriceSettingMode) =>
                      updateValues({
                        mode,
                        percentage:
                          mode === 'percentage' ? values.percentage : undefined,
                        fixedPrice: mode === 'fixed' ? values.fixedPrice : undefined,
                      })
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Foiz qo&apos;shish</SelectItem>
                      <SelectItem value="fixed">Qo&apos;lda narx</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {showPercentage && (
              <Field>
                <FieldLabel>Foyda foizi (%)</FieldLabel>
                <FieldDescription>
                  Sozlamada ko&apos;rsatilmagan tavarlar avtomatik{' '}
                  {DEFAULT_MARKUP_PERCENT}% foyda bilan sotiladi. Bu yerda
                  standartdan yuqori yoki past foiz belgilang.
                </FieldDescription>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={values.percentage ?? ''}
                  onChange={(event) =>
                    updateValues({
                      percentage:
                        event.target.value === ''
                          ? undefined
                          : Number(event.target.value),
                    })
                  }
                  placeholder={`Masalan: ${DEFAULT_MARKUP_PERCENT} yoki 30`}
                  disabled={isSaving}
                />
              </Field>
            )}

            {showFixedPrice && (
              <Field>
                <FieldLabel>Sotuv narxi (so&apos;m)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={values.fixedPrice ?? ''}
                  onChange={(event) =>
                    updateValues({
                      fixedPrice:
                        event.target.value === ''
                          ? undefined
                          : Number(event.target.value),
                    })
                  }
                  placeholder="Masalan: 1250000"
                  disabled={isSaving}
                />
              </Field>
            )}

            <Field orientation="horizontal">
              <FieldLabel htmlFor="price-setting-active">Faol</FieldLabel>
              <Switch
                id="price-setting-active"
                checked={values.isActive}
                onCheckedChange={(isActive) => updateValues({ isActive })}
                disabled={isSaving}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {displayError ? <FieldError>{displayError}</FieldError> : null}

      <Separator className="shrink-0" />

      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Bekor qilish
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !canSubmitPriceSettingForm(values)}
        >
          {isSaving ? (
            <>
              <AppIcon name="loader" className="animate-spin" />
              Saqlanmoqda...
            </>
          ) : mode === 'create' ? (
            "Qo'shish"
          ) : (
            'Saqlash'
          )}
        </Button>
      </div>
    </form>
  )
}
