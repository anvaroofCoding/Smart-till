import { DatePicker } from '@/components/ui/date-picker'
import { TABLE_FILTER_FIELD_CLASS } from './table-filter-field'

interface TableFilterDatePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  'aria-label'?: string
}

export function TableFilterDatePicker({
  value,
  onChange,
  disabled,
  placeholder = 'dd.mm.yyyy',
  'aria-label': ariaLabel,
}: TableFilterDatePickerProps) {
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={TABLE_FILTER_FIELD_CLASS}
      aria-label={ariaLabel}
    />
  )
}
