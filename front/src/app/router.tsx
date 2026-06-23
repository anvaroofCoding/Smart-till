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
import { ProductCategoriesPage } from '@/pages/product-categories-page'
import { ProductBrandsPage } from '@/pages/product-brands-page'
import { ProductsPage } from '@/pages/products-page'
import { ProductCreatePage } from '@/pages/product-create-page'
import { ProductEditPage } from '@/pages/product-edit-page'
import { PlaceholderPage } from '@/pages/placeholder-page'

const menuRoutes = flattenSidebarRoutes()

const SETTINGS_PATH = 'sozlamalar/dastur'
const USERS_PATH = 'sozlamalar/foydalanuvchilar'
const PRODUCT_CATEGORIES_PATH = 'maxsulotlar/kategoriya'
const PRODUCT_BRANDS_PATH = 'maxsulotlar/brend'
const PRODUCTS_PATH = 'maxsulotlar/ro-yxat'
const PRODUCT_CREATE_PATH = 'maxsulotlar/ro-yxat/yaratish'
const PRODUCT_EDIT_PATH = 'maxsulotlar/ro-yxat/:id/tahrirlash'
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
              ) : route.path === PRODUCT_CATEGORIES_PATH ? (
                <ProductCategoriesPage />
              ) : route.path === PRODUCT_BRANDS_PATH ? (
                <ProductBrandsPage />
              ) : route.path === PRODUCTS_PATH ? (
                <ProductsPage />
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
          {
            path: PRODUCT_CREATE_PATH,
            element: <ProductCreatePage />,
          },
          {
            path: PRODUCT_EDIT_PATH,
            element: <ProductEditPage />,
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
