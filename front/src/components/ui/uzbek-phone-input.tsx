import { formatUzbekPhoneLocal } from '@/lib/phone'
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
  placeholder = '90 123 45 67',
  ...props
}: UzbekPhoneInputProps) {
  return (
    <div className={cn('relative', className)}>
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
        +998
      </span>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(formatUzbekPhoneLocal(e.target.value))}
        placeholder={placeholder}
        className="pl-14"
        {...props}
      />
    </div>
  )
}
