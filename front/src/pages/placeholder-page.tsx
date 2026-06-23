interface PlaceholderPageProps {
  title: string
  section?: string
}

export function PlaceholderPage({ title, section }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-8 text-center">
      <p className="text-muted-foreground text-sm">
        {section ? `${section} / ` : ''}
        {title}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Bu sahifa keyingi bosqichda to&apos;ldiriladi.
      </p>
    </div>
  )
}
