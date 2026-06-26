import { useState } from 'react'

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
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { UzbekPhoneInput } from '@/components/ui/uzbek-phone-input'
import { DatePicker } from '@/components/ui/date-picker'
import { Separator } from '@/components/ui/separator'
import { buildUzbekPhone, parseUzbekPhoneLocal } from '@/lib/phone'
import type { AuthUser } from '@/types/api.types'
import type { UpdateProfileRequest } from '@/types/api.types'

export interface ProfileFormValues {
  firstName: string
  lastName: string
  login: string
  phone: string
  birthDate: string
  password: string
  confirmPassword: string
}

export function authUserToProfileForm(user: AuthUser): ProfileFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    login: user.login,
    phone: parseUzbekPhoneLocal(user.phone),
    birthDate: user.birthDate ?? '',
    password: '',
    confirmPassword: '',
  }
}

export function validateProfileForm(values: ProfileFormValues): string | null {
  if (!values.firstName.trim()) return 'Ismni kiriting'
  if (!values.lastName.trim()) return 'Familiyani kiriting'
  if (!values.login.trim()) return 'Loginni kiriting'
  if (values.login.trim().length < 2) {
    return "Login kamida 2 belgidan iborat bo'lishi kerak"
  }

  if (values.password && values.password.length < 6) {
    return "Parol kamida 6 belgidan iborat bo'lishi kerak"
  }

  if (values.password !== values.confirmPassword) {
    return 'Parollar mos kelmadi'
  }

  return null
}

export function buildProfilePayload(form: ProfileFormValues): UpdateProfileRequest {
  const payload: UpdateProfileRequest = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    login: form.login.trim(),
    phone: buildUzbekPhone(form.phone),
    birthDate: form.birthDate || undefined,
  }

  if (form.password) {
    payload.password = form.password
  }

  return payload
}

interface ProfileFormProps {
  user: AuthUser
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: ProfileFormValues) => void
}

export function ProfileForm({
  user,
  isSaving = false,
  error,
  onSubmit,
}: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormValues>(() =>
    authUserToProfileForm(user),
  )
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function updateField<K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
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
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="password">Yangi parol</FieldLabel>
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
                    required={Boolean(form.password)}
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

        {error && <FieldError>{error}</FieldError>}
      </div>

      <Separator className="shrink-0" />

      <div className="flex shrink-0 justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <AppIcon name="loader" className="animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            'Saqlash'
          )}
        </Button>
      </div>
    </form>
  )
}
