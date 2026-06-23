import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface SettingsSelectProps<T extends string> {
  id: string
  label: string
  hint?: string
  value: T
  options: { id: T; label: string }[]
  onChange: (value: T) => void
  className?: string
  disabled?: boolean
}

export function SettingsSelect<T extends string>({
  id,
  label,
  hint,
  value,
  options,
  onChange,
  className,
  disabled,
}: SettingsSelectProps<T>) {
  return (
    <Field className={cn(className)}>
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {hint && <FieldDescription>{hint}</FieldDescription>}
        <Select
          value={value}
          onValueChange={(next) => onChange(next as T)}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Tanlang" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldContent>
    </Field>
  )
}
