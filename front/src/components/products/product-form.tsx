import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { ProductImageThumb } from '@/components/products/product-image-thumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { readImageFileAsDataUrl } from '@/lib/image-file'
import { cn } from '@/lib/utils'
import type { ProductBrandRecord } from '@/types/product-brand.types'
import type { ProductCategoryRecord } from '@/types/product-category.types'
import type { CreateProductRequest, ProductRecord } from '@/types/product.types'

const CATEGORY_PATH = '/maxsulotlar/kategoriya'
const BRAND_PATH = '/maxsulotlar/brend'

export interface ProductFormValues {
  name: string
  description: string
  categoryId: string
  brandId: string
  image: string
  isActive: boolean
}

export const emptyProductForm: ProductFormValues = {
  name: '',
  description: '',
  categoryId: '',
  brandId: '',
  image: '',
  isActive: true,
}

export function productToFormValues(product: ProductRecord): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? '',
    categoryId: product.category.id,
    brandId: product.brand.id,
    image: product.image,
    isActive: product.isActive,
  }
}

export function validateProductForm(values: ProductFormValues): string | null {
  if (!values.name.trim()) return 'Maxsulot nomini kiriting'
  if (!values.categoryId) return 'Kategoriyani tanlang'
  if (!values.brandId) return 'Brendni tanlang'
  return null
}

export function buildProductPayload(
  values: ProductFormValues,
): CreateProductRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    categoryId: values.categoryId,
    brandId: values.brandId,
    image: values.image.trim(),
    isActive: values.isActive,
  }
}

interface ProductFormProps {
  mode: 'create' | 'edit'
  initialValues: ProductFormValues
  categories: ProductCategoryRecord[]
  brands: ProductBrandRecord[]
  product?: ProductRecord | null
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: ProductFormValues) => void | Promise<void>
  onCancel: () => void
}

export function ProductForm({
  mode,
  initialValues,
  categories,
  brands,
  product,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormValues>(initialValues)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeCategories = useMemo(() => {
    const active = categories.filter((item) => item.isActive)
    if (mode === 'edit' && product) {
      const current = categories.find((item) => item.id === product.category.id)
      if (current && !active.some((item) => item.id === current.id)) {
        return [...active, current]
      }
    }
    return active
  }, [categories, mode, product])

  const activeBrands = useMemo(() => {
    const active = brands.filter((item) => item.isActive)
    if (mode === 'edit' && product) {
      const current = brands.find((item) => item.id === product.brand.id)
      if (current && !active.some((item) => item.id === current.id)) {
        return [...active, current]
      }
    }
    return active
  }, [brands, mode, product])

  const canSubmit =
    activeCategories.length > 0 && activeBrands.length > 0 && !isSaving

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    try {
      setImageError(null)
      const dataUrl = await readImageFileAsDataUrl(file)
      setForm((prev) => ({ ...prev, image: dataUrl }))
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Rasm yuklanmadi')
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validationError = validateProductForm(form)
    if (validationError) {
      return
    }
    await onSubmit(form)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Asosiy ma&apos;lumotlar</CardTitle>
          <CardDescription>
            Nom, kategoriya va brend majburiy. Maxsulot kodi saqlanganda
            avtomatik beriladi. Rasm ixtiyoriy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="product-name">
                Maxsulot nomi <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Masalan: Samsung Galaxy A55"
                disabled={isSaving}
                autoFocus
              />
            </Field>

            {mode === 'edit' && product?.code ? (
              <Field>
                <FieldLabel htmlFor="product-code">Maxsulot kodi</FieldLabel>
                <Input
                  id="product-code"
                  value={product.code}
                  readOnly
                  disabled
                  className="bg-muted font-mono"
                />
                <p className="text-muted-foreground text-xs">
                  Kod tizim tomonidan beriladi va o&apos;zgartirilmaydi.
                </p>
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="product-description">Izoh</FieldLabel>
              <Input
                id="product-description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Qisqa izoh"
                disabled={isSaving}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="product-category">
                  Kategoriya <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={form.categoryId}
                  onValueChange={(categoryId) =>
                    setForm((prev) => ({ ...prev, categoryId }))
                  }
                  disabled={isSaving || activeCategories.length === 0}
                >
                  <SelectTrigger id="product-category" className="w-full">
                    <SelectValue placeholder="Kategoriyani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeCategories.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    Avval{' '}
                    <Link
                      to={CATEGORY_PATH}
                      className="text-primary font-medium hover:underline"
                    >
                      kategoriya qo&apos;shing
                    </Link>
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="product-brand">
                  Brend <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={form.brandId}
                  onValueChange={(brandId) =>
                    setForm((prev) => ({ ...prev, brandId }))
                  }
                  disabled={isSaving || activeBrands.length === 0}
                >
                  <SelectTrigger id="product-brand" className="w-full">
                    <SelectValue placeholder="Brendni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBrands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeBrands.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    Avval{' '}
                    <Link
                      to={BRAND_PATH}
                      className="text-primary font-medium hover:underline"
                    >
                      brend qo&apos;shing
                    </Link>
                  </p>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="product-image">Rasm</FieldLabel>
              <div className="flex items-start gap-4">
                <ProductImageThumb
                  image={form.image}
                  name={form.name || 'Maxsulot'}
                  size="lg"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={isSaving}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Rasm tanlash
                  </Button>
                  {form.image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-auto w-fit p-0 text-xs"
                      disabled={isSaving}
                      onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                    >
                      Rasmini olib tashlash
                    </Button>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Ixtiyoriy. Faqat 1 ta rasm, maks. 2 MB. Yuklanmasa standart
                    ikonka ishlatiladi. Rasmga bosib kattaroq ko&apos;rishingiz
                    mumkin.
                  </p>
                </div>
              </div>
              {imageError && <FieldError>{imageError}</FieldError>}
            </Field>

            <Field>
              <div className="flex items-center justify-between gap-4">
                <FieldLabel htmlFor="product-active">Holat</FieldLabel>
                <div className="flex items-center gap-2">
                  <Switch
                    id="product-active"
                    checked={form.isActive}
                    disabled={isSaving}
                    onCheckedChange={(isActive) =>
                      setForm((prev) => ({ ...prev, isActive }))
                    }
                  />
                  <Label
                    htmlFor="product-active"
                    className={cn(
                      'text-sm font-medium',
                      form.isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {form.isActive ? 'Faol' : 'Nofaol'}
                  </Label>
                </div>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {(error || (!canSubmit && !isSaving)) && (
        <FieldError>
          {error ??
            (activeCategories.length === 0
              ? 'Maxsulot qo\'shish uchun avval kategoriya yarating'
              : 'Maxsulot qo\'shish uchun avval brend yarating')}
        </FieldError>
      )}

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
        <Button type="submit" disabled={!canSubmit}>
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
