import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'

import {
  UserForm,
  buildUserPayload,
  emptyUserForm,
  validateUserForm,
} from '@/components/users/user-form'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import type { CreateUserRequest } from '@/types/user.types'
import { useCreateUserMutation } from '@/store/api/users.api'

const USERS_LIST_PATH = '/sozlamalar/foydalanuvchilar'

export function UserCreatePage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [createUser, createState] = useCreateUserMutation()

  usePageMeta({
    title: pageTitle('Yangi foydalanuvchi', 'Sozlamalar'),
  })

  async function handleSubmit(form: typeof emptyUserForm) {
    setError(null)

    const validationError = validateUserForm(form, 'create')
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await createUser(buildUserPayload(form) as CreateUserRequest).unwrap()
      navigate(USERS_LIST_PATH)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Foydalanuvchi yaratish amalga oshmadi'))
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={USERS_LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Yangi foydalanuvchi
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Ma&apos;lumotlarni to&apos;ldiring va sahifalarga ruxsat bering.
            </p>
          </div>
        </div>
      </div>

      <UserForm
        mode="create"
        initialValues={emptyUserForm}
        isSaving={createState.isLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(USERS_LIST_PATH)}
      />
    </div>
  )
}
