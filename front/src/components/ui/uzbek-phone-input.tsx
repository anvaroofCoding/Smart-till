import {
  formatUzbekPhoneMasked,
  parseUzbekPhoneLocal,
} from '@/lib/phone'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type UzbekPhoneInputProps = Omit<
  React.ComponentProps<'input'>,
  'value' | 'onChange' | 'type'
> & {
  value: string
  onChange: (value: string) => void
}

export function UzbekPhoneInput({
  id,
  value,
  onChange,
  className,
  placeholder = '+998 90 123 45 67',
  ...props
}: UzbekPhoneInputProps) {
  return (
    <Input
      id={id}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      value={formatUzbekPhoneMasked(value)}
      onChange={(e) => onChange(parseUzbekPhoneLocal(e.target.value))}
      placeholder={placeholder}
      className={cn(className)}
      {...props}
    />
  )
}
