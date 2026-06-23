import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { uz } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  formatDateDisplay,
  parseIsoDate,
  toIsoDateString,
} from '@/lib/date-format'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  id?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  id,
  value = '',
  onChange,
  placeholder = 'dd.mm.yyyy',
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseIsoDate(value)
  const currentYear = new Date().getFullYear()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="size-4" />
          {value ? formatDateDisplay(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={uz}
          captionLayout="dropdown"
          fromYear={currentYear - 100}
          toYear={currentYear}
          selected={selected}
          disabled={{ after: new Date() }}
          onSelect={(date) => {
            if (date) {
              onChange(toIsoDateString(date))
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
