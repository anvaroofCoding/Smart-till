import { useMemo, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
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
import { UzbekPhoneInput } from '@/components/ui/uzbek-phone-input'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { sidebarMenu } from '@/config/sidebar-menu'
import { buildUzbekPhone, parseUzbekPhoneLocal } from '@/lib/phone'
import { useGetWarehousesQuery } from '@/store/api/warehouses.api'
import type { UserPosition } from '@/types/api.types'
import {
  POSITION_LABELS,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserRecord,
} from '@/types/user.types'

const POSITIONS = Object.keys(POSITION_LABELS) as UserPosition[]

export interface UserFormValues {
  firstName: string
  lastName: string
  login: string
  phone: string
  birthDate: string
  password: string
  confirmPassword: string
  position: UserPosition
  allowedPages: string[]
  allWarehouses: boolean
  warehouseIds: string[]
  isActive: boolean
}

export const emptyUserForm: UserFormValues = {
  firstName: '',
  lastName: '',
  login: '',
  phone: '',
  birthDate: '',
  password: '',
  confirmPassword: '',
  position: 'kassir',
  allowedPages: [],
  allWarehouses: false,
  warehouseIds: [],
  isActive: true,
}

export function userToFormValues(user: UserRecord): UserFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    login: user.login,
    phone: parseUzbekPhoneLocal(user.phone),
    birthDate: user.birthDate ?? '',
    password: '',
    confirmPassword: '',
    position: user.position,
    allowedPages: user.allowedPages ?? [],
    allWarehouses: user.allWarehouses ?? user.position === 'admin',
    warehouseIds: user.warehouseIds ?? [],
    isActive: user.isActive,
  }
}

export function validateUserForm(
  values: UserFormValues,
  mode: 'create' | 'edit',
): string | null {
  if (!values.firstName.trim()) return 'Ismni kiriting'
  if (!values.lastName.trim()) return 'Familiyani kiriting'
  if (!values.login.trim()) return 'Loginni kiriting'
  if (values.login.trim().length < 2) {
    return "Login kamida 2 belgidan iborat bo'lishi kerak"
  }

  if (mode === 'create') {
    if (!values.password) return 'Parolni kiriting'
    if (values.password.length < 6) {
      return "Parol kamida 6 belgidan iborat bo'lishi kerak"
    }
  } else if (values.password && values.password.length < 6) {
    return "Parol kamida 6 belgidan iborat bo'lishi kerak"
  }

  if (values.password !== values.confirmPassword) {
    return 'Parollar mos kelmadi'
  }

  if (values.position !== 'admin' && values.allowedPages.length === 0) {
    return 'Kamida bitta sahifaga ruxsat bering'
  }

  if (
    values.position !== 'admin' &&
    !values.allWarehouses &&
    values.warehouseIds.length === 0
  ) {
    return 'Kamida bitta omborni tanlang yoki barcha omborlarga ruxsat bering'
  }

  return null
}

export function buildUserPayload(
  form: UserFormValues,
  mode: 'create' | 'edit' = 'create',
): CreateUserRequest | UpdateUserRequest {
  const payload: CreateUserRequest | UpdateUserRequest = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    login: form.login.trim(),
    phone: buildUzbekPhone(form.phone),
    birthDate: form.birthDate || undefined,
    position: form.position,
    allowedPages: form.position === 'admin' ? [] : form.allowedPages,
    allWarehouses: form.position === 'admin' ? true : form.allWarehouses,
    warehouseIds:
      form.position === 'admin' || form.allWarehouses ? [] : form.warehouseIds,
  }

  if (form.password) {
    payload.password = form.password
  }

  if (mode === 'edit') {
    ;(payload as UpdateUserRequest).isActive = form.isActive
  }

  return payload
}

interface UserFormProps {
  mode: 'create' | 'edit'
  initialValues: UserFormValues
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: UserFormValues) => void
  onCancel: () => void
}

export function UserForm({
  mode,
  initialValues,
  isSaving = false,
  error,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const [form, setForm] = useState<UserFormValues>(initialValues)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const warehousesQuery = useGetWarehousesQuery({ page: 1, perPage: 100 })
  const activeWarehouses = warehousesQuery.data?.data.filter((item) => item.isActive) ?? []

  const sectionPages = useMemo(
    () =>
      sidebarMenu.map((section) => ({
        title: section.title,
        pages: section.items.map((item) => ({
          url: item.url,
          title: item.title,
        })),
      })),
    [],
  )

  function updateField<K extends keyof UserFormValues>(
    key: K,
    value: UserFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function togglePage(url: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      allowedPages: checked
        ? [...prev.allowedPages, url]
        : prev.allowedPages.filter((page) => page !== url),
    }))
  }

  function toggleSection(pages: string[], checked: boolean) {
    setForm((prev) => {
      if (checked) {
        const merged = new Set([...prev.allowedPages, ...pages])
        return { ...prev, allowedPages: [...merged] }
      }
      return {
        ...prev,
        allowedPages: prev.allowedPages.filter((page) => !pages.includes(page)),
      }
    })
  }

  function toggleWarehouse(warehouseId: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      warehouseIds: checked
        ? [...prev.warehouseIds, warehouseId]
        : prev.warehouseIds.filter((id) => id !== warehouseId),
    }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Shaxsiy ma&apos;lumotlar</CardTitle>
            <CardDescription>
              Ism, login, telefon va boshqa asosiy ma&apos;lumotlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="firstName">Ism</FieldLabel>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Islom"
                    disabled={isSaving}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="lastName">Familiya</FieldLabel>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Karimov"
                    disabled={isSaving}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="login">Login</FieldLabel>
                  <Input
                    id="login"
                    value={form.login}
                    onChange={(e) => updateField('login', e.target.value)}
                    placeholder="islom.k"
                    autoComplete="username"
                    disabled={isSaving}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">Telefon raqami</FieldLabel>
                  <UzbekPhoneInput
                    id="phone"
                    value={form.phone}
                    onChange={(phone) => updateField('phone', phone)}
                    disabled={isSaving}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="birthDate">Tug&apos;ilgan sana</FieldLabel>
                  <DatePicker
                    id="birthDate"
                    value={form.birthDate}
                    onChange={(value) => updateField('birthDate', value)}
                    placeholder="dd.mm.yyyy"
                    disabled={isSaving}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="position">Lavozim</FieldLabel>
                  <Select
                    value={form.position}
                    onValueChange={(value) => {
                      const position = value as UserPosition
                      updateField('position', position)
                      if (position === 'admin') {
                        setForm((prev) => ({
                          ...prev,
                          allWarehouses: true,
                          warehouseIds: [],
                        }))
                      }
                    }}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="position" className="w-full">
                      <SelectValue placeholder="Lavozimni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((position) => (
                        <SelectItem key={position} value={position}>
                          {POSITION_LABELS[position]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Administrator barcha sahifalarga avtomatik ruxsatga ega.
                  </FieldDescription>
                </Field>

                {mode === 'edit' && (
                  <Field className="md:col-span-2 xl:col-span-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FieldLabel htmlFor="isActive">Hisob holati</FieldLabel>
                        <FieldDescription>
                          Nofaol foydalanuvchi tizimga kira olmaydi. Holatni istalgan
                          vaqtda o&apos;zgartirish mumkin.
                        </FieldDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="isActive"
                          checked={form.isActive}
                          onCheckedChange={(checked) =>
                            updateField('isActive', checked)
                          }
                          disabled={isSaving}
                        />
                        <Label htmlFor="isActive" className="text-sm font-medium">
                          {form.isActive ? 'Faol' : 'Nofaol'}
                        </Label>
                      </div>
                    </div>
                  </Field>
                )}
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parol</CardTitle>
            <CardDescription>
              {mode === 'create'
                ? 'Yangi foydalanuvchi uchun parol kiriting'
                : 'Parolni o\'zgartirish ixtiyoriy'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="password">
                  {mode === 'edit' ? 'Yangi parol' : 'Parol'}
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••"
                    autoComplete="new-password"
                    disabled={isSaving}
                    className="pr-10"
                    required={mode === 'create'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isSaving}
                    aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rish'}
                  >
                    {showPassword ? (
                      <AppIcon name="eye-off" className="text-muted-foreground" />
                    ) : (
                      <AppIcon name="eye" className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Parolni tasdiqlash</FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      updateField('confirmPassword', e.target.value)
                    }
                    placeholder="••••••"
                    autoComplete="new-password"
                    disabled={isSaving}
                    className="pr-10"
                    required={mode === 'create' || Boolean(form.password)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={isSaving}
                    aria-label={
                      showConfirmPassword ? 'Parolni yashirish' : 'Parolni ko\'rish'
                    }
                  >
                    {showConfirmPassword ? (
                      <AppIcon name="eye-off" className="text-muted-foreground" />
                    ) : (
                      <AppIcon name="eye" className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </Field>
            </div>
          </CardContent>
        </Card>

        {form.position !== 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Ombor ruxsati</CardTitle>
              <CardDescription>
                Foydalanuvchi qaysi omborda ishlashini yoki barcha omborlarni
                ko&apos;rishini belgilang. Tanlangan ombor uning filiali hisoblanadi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <FieldLabel htmlFor="all-warehouses">
                    Barcha omborlarga ruxsat
                  </FieldLabel>
                  <FieldDescription>
                    Yoqilganda foydalanuvchi barcha omborlardagi ma&apos;lumotlarni ko&apos;radi.
                  </FieldDescription>
                </div>
                <Switch
                  id="all-warehouses"
                  checked={form.allWarehouses}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      allWarehouses: checked,
                      warehouseIds: checked ? [] : prev.warehouseIds,
                    }))
                  }
                  disabled={isSaving}
                />
              </div>

              {!form.allWarehouses && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {activeWarehouses.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Faol omborlar topilmadi. Avval ombor yarating.
                    </p>
                  ) : (
                    activeWarehouses.map((warehouse) => (
                      <div
                        key={warehouse.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <Checkbox
                          id={`warehouse-${warehouse.id}`}
                          checked={form.warehouseIds.includes(warehouse.id)}
                          onCheckedChange={(checked) =>
                            toggleWarehouse(warehouse.id, checked === true)
                          }
                          disabled={isSaving}
                        />
                        <Label
                          htmlFor={`warehouse-${warehouse.id}`}
                          className="cursor-pointer text-sm font-medium"
                        >
                          {warehouse.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {form.position !== 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Sahifalarga ruxsat</CardTitle>
              <CardDescription>
                Qaysi sahifalarni ko&apos;rishi va qaysilarini ko&apos;rmasligi
                kerakligini belgilang. Barcha bo&apos;limlar shu yerda ko&apos;rinadi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sectionPages.map((section) => {
                  const urls = section.pages.map((page) => page.url)
                  const allChecked = urls.every((url) =>
                    form.allowedPages.includes(url),
                  )
                  const someChecked =
                    !allChecked &&
                    urls.some((url) => form.allowedPages.includes(url))

                  return (
                    <Card key={section.title} className="bg-muted/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`section-${section.title}`}
                            checked={
                              allChecked
                                ? true
                                : someChecked
                                  ? 'indeterminate'
                                  : false
                            }
                            onCheckedChange={(checked) =>
                              toggleSection(urls, checked === true)
                            }
                            disabled={isSaving}
                          />
                          <Label
                            htmlFor={`section-${section.title}`}
                            className="cursor-pointer text-sm font-semibold"
                          >
                            {section.title}
                          </Label>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {section.pages.map((page) => (
                          <div key={page.url} className="flex items-center gap-3">
                            <Checkbox
                              id={page.url}
                              checked={form.allowedPages.includes(page.url)}
                              onCheckedChange={(checked) =>
                                togglePage(page.url, checked === true)
                              }
                              disabled={isSaving}
                            />
                            <Label
                              htmlFor={page.url}
                              className="cursor-pointer text-sm font-normal text-muted-foreground"
                            >
                              {page.title}
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {error && <FieldError>{error}</FieldError>}
      </div>

      <Separator className="shrink-0" />

      <div className="flex shrink-0 flex-wrap justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <AppIcon name="loader" className="animate-spin" />
              Saqlanmoqda...
            </>
          ) : mode === 'create' ? (
            'Yaratish'
          ) : (
            'Saqlash'
          )}
        </Button>
      </div>
    </form>
  )
}
