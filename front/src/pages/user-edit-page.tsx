import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { FormPageSkeleton } from '@/components/loading'
import {
  UserForm,
  buildUserPayload,
  userToFormValues,
  validateUserForm,
} from '@/components/users/user-form'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { useGetUserQuery, useUpdateUserMutation } from '@/store/api/users.api'

const USERS_LIST_PATH = '/sozlamalar/foydalanuvchilar'

export function UserEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const userQuery = useGetUserQuery(id, { skip: !id })
  const { data: user, error: loadError } = userQuery
  const { showSkeleton } = useQueryLoading(userQuery)
  const [updateUser, updateState] = useUpdateUserMutation()

  usePageMeta({
    title: pageTitle(
      user ? `${user.firstName} ${user.lastName}` : 'Tahrirlash',
      'Foydalanuvchilar',
    ),
  })

  async function handleSubmit(form: ReturnType<typeof userToFormValues>) {
    if (!id) return
    setError(null)

    const validationError = validateUserForm(form, 'edit')
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await updateUser({ id, body: buildUserPayload(form) }).unwrap()
      navigate(USERS_LIST_PATH)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Saqlash amalga oshmadi'))
    }
  }

  if (showSkeleton) {
    return <FormPageSkeleton sections={2} fieldsPerSection={4} />
  }

  if (loadError || !user) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(loadError, 'Foydalanuvchi topilmadi')}
        </p>
        <Button variant="outline" asChild>
          <Link to={USERS_LIST_PATH}>Ro&apos;yxatga qaytish</Link>
        </Button>
      </div>
    )
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
              Foydalanuvchini tahrirlash
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {user.firstName} {user.lastName} — ma&apos;lumotlar va ruxsatlar
            </p>
          </div>
        </div>
      </div>

      <UserForm
        key={user.id}
        mode="edit"
        initialValues={userToFormValues(user)}
        isSaving={updateState.isLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(USERS_LIST_PATH)}
      />
    </div>
  )
}
