import { useEffect, useState } from 'react'

import { FormPageSkeleton } from '@/components/loading'
import {
  ProfileForm,
  authUserToProfileForm,
  buildProfilePayload,
  validateProfileForm,
} from '@/components/profile/profile-form'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { useAppDispatch } from '@/store'
import { useGetMeQuery, useUpdateProfileMutation } from '@/store/api'
import { updateUser } from '@/store/slices/auth.slice'

export function ProfilePage() {
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  const meQuery = useGetMeQuery()
  const { data, error: loadError } = meQuery
  const user = data?.user
  const { showSkeleton } = useQueryLoading(meQuery)
  const [updateProfile, updateState] = useUpdateProfileMutation()

  usePageMeta({
    title: pageTitle('Profil'),
  })

  useEffect(() => {
    if (!loadError) return
    notify.error(getApiErrorMessage(loadError, 'Profil yuklanmadi'))
  }, [loadError])

  async function handleSubmit(form: ReturnType<typeof authUserToProfileForm>) {
    setError(null)

    const validationError = validateProfileForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      const result = await updateProfile(buildProfilePayload(form)).unwrap()
      dispatch(updateUser(result.user))
      setFormKey((prev) => prev + 1)
      notify.success('Profil saqlandi')
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Saqlash amalga oshmadi'))
    }
  }

  if (showSkeleton) {
    return <FormPageSkeleton sections={2} fieldsPerSection={3} />
  }

  if (loadError || !user) {
    return (
      <p className="text-destructive text-sm">
        {getApiErrorMessage(loadError, 'Profil yuklanmadi')}
      </p>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="shrink-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="text-muted-foreground text-sm">
          Shaxsiy ma&apos;lumotlaringizni ko&apos;ring va tahrirlang
        </p>
      </div>

      <ProfileForm
        key={`${user.id}-${formKey}`}
        user={user}
        isSaving={updateState.isLoading}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
