import { AppIcon } from '@/components/icons/app-icon'
import { SettingsSelect } from '@/components/settings/settings-select'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
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

const MODE_OPTIONS: { id: ColorMode; label: string }[] = [
  { id: 'light', label: "Yorug'" },
  { id: 'dark', label: "Qorong'u" },
]

export function AppSettingsPage() {
  const { settings, updateSettings, resetSettings } = useAppearance()

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 overflow-y-auto">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Dastur sozlamalari
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ko&apos;rinish, shrift, ikonka va bildirishnomalarni shu yerdan boshqaring.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetSettings}>
          <AppIcon name="rotate-ccw" />
          Standartga qaytarish
        </Button>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="sm:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AppIcon name="settings-2" />
              Asosiy
            </CardTitle>
            <CardDescription>Bildirishnomalar va rang rejimi</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-6">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="notifications">Bildirishnomalar</FieldLabel>
                  <FieldDescription>
                    Yangi xabarlar va ogohlantirishlarni ko&apos;rsatish
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="notifications"
                  checked={settings.notificationsEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings({ notificationsEnabled: checked })
                  }
                />
              </Field>

              <FieldSeparator />

              <div className="grid gap-6 sm:grid-cols-2">
                <SettingsSelect
                  id="mode"
                  label="Rang rejimi"
                  hint="Yorug' yoki qorong'u — butun dastur ranglari o'zgaradi"
                  value={settings.mode}
                  options={MODE_OPTIONS}
                  onChange={(mode) => updateSettings({ mode })}
                />

                <SettingsSelect
                  id="radius"
                  label="Burchak yumaloqligi"
                  hint="Tugmalar va kartalar burchak shakli"
                  value={settings.radius}
                  options={RADIUS_OPTIONS}
                  onChange={(radius) => updateSettings({ radius })}
                />
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Komponentlar uslubi</CardTitle>
            <CardDescription>Interfeys elementlari ko&apos;rinishi</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsSelect
              id="style"
              label="Uslub"
              value={settings.style}
              options={UI_STYLES}
              onChange={(style) => updateSettings({ style })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asosiy rang</CardTitle>
            <CardDescription>Fon va neytral ranglar</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsSelect
              id="baseColor"
              label="Asosiy palitra"
              value={settings.baseColor}
              options={BASE_COLORS}
              onChange={(baseColor) => updateSettings({ baseColor })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mavzu</CardTitle>
            <CardDescription>Urg&apos;u va asosiy rang</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsSelect
              id="theme"
              label="Urg'u rangi"
              value={settings.theme}
              options={ACCENT_THEMES}
              onChange={(theme) => updateSettings({ theme })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shriftlar</CardTitle>
            <CardDescription>Sarlavha va matn shrifti</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <SettingsSelect
                id="headingFont"
                label="Sarlavha shrifti"
                value={settings.headingFont}
                options={FONT_OPTIONS}
                onChange={(headingFont) => updateSettings({ headingFont })}
              />
              <SettingsSelect
                id="bodyFont"
                label="Asosiy matn shrifti"
                value={settings.bodyFont}
                options={FONT_OPTIONS}
                onChange={(bodyFont) => updateSettings({ bodyFont })}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ikonkalar</CardTitle>
            <CardDescription>Ikonka kutubxonasi</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsSelect
              id="iconLibrary"
              label="Kutubxona"
              hint="Yon panel, tugmalar va barcha ikonlar shu kutubxonadan ko'rinadi"
              value={settings.iconLibrary}
              options={ICON_LIBRARIES}
              onChange={(iconLibrary) => updateSettings({ iconLibrary })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
