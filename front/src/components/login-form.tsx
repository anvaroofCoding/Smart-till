import { useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { getApiErrorMessage, getApiErrorStatus, isRequestAbortedError } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import {
  clearLoginFailures,
  getLoginRetryAfterSeconds,
  recordLoginFailure,
  useLoginLockout,
} from '@/hooks/use-login-lockout'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const navigate = useNavigate()
  const { login, isLoggingIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { isLockedOut, secondsLeft, startLockout } = useLoginLockout()

  const isDisabled = isLoggingIn || isLockedOut

  useEffect(() => {
    if (!isLockedOut) return
    setFormError(null)
  }, [isLockedOut])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLockedOut) return

    setFormError(null)

    const formData = new FormData(event.currentTarget)
    const loginValue = String(formData.get('login') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!loginValue || !password) {
      setFormError('Login va parolni kiriting')
      return
    }

    try {
      await login({ login: loginValue, password })
      clearLoginFailures(loginValue)
      navigate('/kassir/buyurtmalar', { replace: true })
    } catch (error) {
      let retryAfterSeconds = getLoginRetryAfterSeconds(error)

      if (!retryAfterSeconds) {
        const status = getApiErrorStatus(error)
        const wrongCredentials =
          status === 401 || isRequestAbortedError(error)

        if (wrongCredentials) {
          retryAfterSeconds = recordLoginFailure(loginValue)
        }
      }

      if (retryAfterSeconds) {
        startLockout(retryAfterSeconds)
        notify.error(
          `Juda ko'p noto'g'ri urinish. ${retryAfterSeconds} soniyadan keyin qayta urinib ko'ring.`,
        )
        return
      }

      notify.error(
        getApiErrorMessage(error, 'Login yoki parol noto\'g\'ri'),
      )
    }
  }

  const errorMessage = formError

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Tizimga kirish</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Login va parolingizni kiriting
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="login">Login</FieldLabel>
          <Input
            id="login"
            name="login"
            type="text"
            autoComplete="username"
            disabled={isDisabled}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Parol</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isDisabled}
              className="pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isDisabled}
              aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rish'}
            >
              {showPassword ? (
                <EyeOff className="size-4 text-muted-foreground" />
              ) : (
                <Eye className="size-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </Field>

        {errorMessage && <FieldError>{errorMessage}</FieldError>}

        <Field>
          <Button type="submit" className="w-full text-white" disabled={isDisabled}>
            {isLoggingIn ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Kirilmoqda...
              </>
            ) : isLockedOut ? (
              `${secondsLeft} s`
            ) : (
              <>
                <LogIn className="size-4" />
                Kirish
              </>
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
