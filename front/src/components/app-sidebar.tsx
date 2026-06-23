import type { ComponentProps } from 'react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { TeamSwitcher } from '@/components/team-switcher'
import { AppLogoMark } from '@/components/app-logo-mark'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { APP_NAME, APP_TAGLINE } from '@/config/app'
import { useSidebarMenuOrder } from '@/hooks/use-sidebar-menu-order'
import { useAuth } from '@/hooks/use-auth'

function TeamLogo({ className }: { className?: string }) {
  return <AppLogoMark variant="plain" className={className} />
}

const teams = [
  {
    name: APP_NAME,
    logo: TeamLogo,
    plan: APP_TAGLINE,
  },
]

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { items, reorderItems } = useSidebarMenuOrder()

  const navUser = {
    name: user?.fullName ?? 'Foydalanuvchi',
    email: user?.email ?? 'admin@smarttill.uz',
    avatar: '',
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} sortable onReorder={reorderItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
