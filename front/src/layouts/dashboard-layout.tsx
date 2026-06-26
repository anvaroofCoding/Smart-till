import { AppSidebar } from '@/components/app-sidebar'
import { NotificationBell } from '@/components/notifications/notification-bell'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { findRouteMeta } from '@/config/sidebar-menu'
import { APP_NAME } from '@/config/app'
import {
  PAGE_EDGE_PADDING_CLASS,
  PAGE_EDGE_PADDING_X_CLASS,
} from '@/config/layout'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function DashboardLayout() {
  const location = useLocation()
  const meta = findRouteMeta(location.pathname)

  usePageMeta({
    title: meta
      ? pageTitle(meta.title, meta.section)
      : pageTitle(),
  })

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className={cn('flex items-center gap-2', PAGE_EDGE_PADDING_X_CLASS)}>
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">{APP_NAME}</BreadcrumbLink>
                </BreadcrumbItem>
                {meta && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">{meta.section}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{meta.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className={PAGE_EDGE_PADDING_X_CLASS}>
            <NotificationBell />
          </div>
        </header>
        <div className={cn('flex flex-1 flex-col gap-6', PAGE_EDGE_PADDING_CLASS)}>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
