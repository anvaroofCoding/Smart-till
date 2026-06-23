import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthGuard, GuestGuard } from '@/app/auth-guard'
import { HomeRedirect } from '@/app/home-redirect'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { flattenSidebarRoutes } from '@/config/sidebar-menu'
import { LoginPage } from '@/pages/login-page'
import { AppSettingsPage } from '@/pages/app-settings-page'
import { UsersPage } from '@/pages/users-page'
import { UserCreatePage } from '@/pages/user-create-page'
import { UserEditPage } from '@/pages/user-edit-page'
import { PlaceholderPage } from '@/pages/placeholder-page'

const menuRoutes = flattenSidebarRoutes()

const SETTINGS_PATH = 'sozlamalar/dastur'
const USERS_PATH = 'sozlamalar/foydalanuvchilar'
const USER_CREATE_PATH = 'sozlamalar/foydalanuvchilar/yaratish'
const USER_EDIT_PATH = 'sozlamalar/foydalanuvchilar/:id/tahrirlash'

const router = createBrowserRouter([
  {
    path: '/login',
    Component: GuestGuard,
    children: [
      {
        index: true,
        Component: LoginPage,
      },
    ],
  },
  {
    path: '/',
    Component: AuthGuard,
    children: [
      {
        Component: DashboardLayout,
        children: [
          {
            index: true,
            element: <HomeRedirect />,
          },
          ...menuRoutes.map((route) => ({
            path: route.path,
            element:
              route.path === SETTINGS_PATH ? (
                <AppSettingsPage />
              ) : route.path === USERS_PATH ? (
                <UsersPage />
              ) : (
                <PlaceholderPage title={route.title} section={route.section} />
              ),
          })),
          {
            path: USER_CREATE_PATH,
            element: <UserCreatePage />,
          },
          {
            path: USER_EDIT_PATH,
            element: <UserEditPage />,
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
