import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const navigate = useNavigate()
  const { login, isLoggingIn, loginError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
      navigate('/kassir/buyurtmalar', { replace: true })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Kirish amalga oshmadi'))
    }
  }

  const errorMessage =
    formError ?? (loginError ? getApiErrorMessage(loginError) : null)

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
            placeholder="admin"
            autoComplete="username"
            disabled={isLoggingIn}
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
              placeholder="••••••"
              autoComplete="current-password"
              disabled={isLoggingIn}
              className="pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isLoggingIn}
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
          <Button type="submit" className="w-full" disabled={isLoggingIn}>
            {isLoggingIn ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Kirilmoqda...
              </>
            ) : (
              'Kirish'
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
