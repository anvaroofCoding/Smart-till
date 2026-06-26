import { AppIcon } from '@/components/icons/app-icon'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
  TABLE_FILTER_CELL_CLASS,
  TABLE_FILTER_FIELD_CLASS,
} from '@/components/shared/table-filter-field'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ACCENT_THEMES,
  BASE_COLORS,
  FONT_OPTIONS,
  ICON_LIBRARIES,
  RADIUS_OPTIONS,
  UI_STYLES,
} from '@/features/appearance/appearance-options'
import { useAppearance } from '@/features/appearance/appearance-context'
import type { ColorMode } from '@/features/appearance/appearance.types'
import { usePageMeta } from '@/hooks/use-page-meta'
import { pageTitle } from '@/config/seo'

const MODE_OPTIONS: { id: ColorMode; label: string }[] = [
  { id: 'light', label: "Yorug'" },
  { id: 'dark', label: "Qorong'u" },
]

const TABLE_HEADERS = ['Sozlama', 'Qiymat'] as const

interface SettingSelectRowProps<T extends string> {
  id: string
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (value: T) => void
}

function SettingSelectRow<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: SettingSelectRowProps<T>) {
  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="w-[42%] font-medium whitespace-nowrap">
        {label}
      </TableCell>
      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select value={value} onValueChange={(next) => onChange(next as T)}>
          <SelectTrigger
            id={id}
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label={label}
          >
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
      </TableCell>
    </TableRow>
  )
}

export function AppSettingsPage() {
  const { settings, updateSettings, resetSettings } = useAppearance()

  usePageMeta({
    title: pageTitle('Dastur sozlamalari', 'Sozlamalar'),
  })

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Dastur sozlamalari
        </h1>
        <Button variant="outline" onClick={resetSettings}>
          <AppIcon name="rotate-ccw" />
          Standartga qaytarish
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="min-h-0 flex-1 overflow-auto">
          <Table className={BORDERLESS_TABLE_CLASS}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {TABLE_HEADERS.map((header) => (
                  <TableHead
                    key={header}
                    className={header === 'Sozlama' ? 'w-[42%]' : undefined}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium whitespace-nowrap">
                  Bildirishnomalar
                </TableCell>
                <TableCell className={TABLE_FILTER_CELL_CLASS}>
                  <div className="flex h-8 items-center">
                    <Switch
                      id="notifications"
                      checked={settings.notificationsEnabled}
                      onCheckedChange={(checked) =>
                        updateSettings({ notificationsEnabled: checked })
                      }
                      aria-label="Bildirishnomalar"
                    />
                  </div>
                </TableCell>
              </TableRow>

              <SettingSelectRow
                id="mode"
                label="Rang rejimi"
                value={settings.mode}
                options={MODE_OPTIONS}
                onChange={(mode) => updateSettings({ mode })}
              />

              <SettingSelectRow
                id="radius"
                label="Burchak yumaloqligi"
                value={settings.radius}
                options={RADIUS_OPTIONS}
                onChange={(radius) => updateSettings({ radius })}
              />

              <SettingSelectRow
                id="style"
                label="Uslub"
                value={settings.style}
                options={UI_STYLES}
                onChange={(style) => updateSettings({ style })}
              />

              <SettingSelectRow
                id="baseColor"
                label="Asosiy palitra"
                value={settings.baseColor}
                options={BASE_COLORS}
                onChange={(baseColor) => updateSettings({ baseColor })}
              />

              <SettingSelectRow
                id="theme"
                label="Urg'u rangi"
                value={settings.theme}
                options={ACCENT_THEMES}
                onChange={(theme) => updateSettings({ theme })}
              />

              <SettingSelectRow
                id="headingFont"
                label="Sarlavha shrifti"
                value={settings.headingFont}
                options={FONT_OPTIONS}
                onChange={(headingFont) => updateSettings({ headingFont })}
              />

              <SettingSelectRow
                id="bodyFont"
                label="Asosiy matn shrifti"
                value={settings.bodyFont}
                options={FONT_OPTIONS}
                onChange={(bodyFont) => updateSettings({ bodyFont })}
              />

              <SettingSelectRow
                id="iconLibrary"
                label="Ikonka kutubxonasi"
                value={settings.iconLibrary}
                options={ICON_LIBRARIES}
                onChange={(iconLibrary) => updateSettings({ iconLibrary })}
              />
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
