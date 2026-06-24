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
import { SuppliersPage } from '@/pages/suppliers-page'
import { SupplierCreatePage } from '@/pages/supplier-create-page'
import { SupplierDetailPage } from '@/pages/supplier-detail-page'
import { SupplierEditPage } from '@/pages/supplier-edit-page'
import { WarehousesPage } from '@/pages/warehouses-page'
import { StockReceiptsPage } from '@/pages/stock-receipts-page'
import { StockReceiptAcceptListPage } from '@/pages/stock-receipt-accept-list-page'
import { StockReceiptAcceptPage } from '@/pages/stock-receipt-accept-page'
import { StockReceiptCreatePage } from '@/pages/stock-receipt-create-page'
import { StockReceiptDetailPage } from '@/pages/stock-receipt-detail-page'
import { WarehouseProductQuantitiesPage } from '@/pages/warehouse-product-quantities-page'
import { WarehouseStockDetailPage } from '@/pages/warehouse-stock-detail-page'
import { PaymentTypeCreatePage } from '@/pages/payment-type-create-page'
import { PaymentTypeEditPage } from '@/pages/payment-type-edit-page'
import { PaymentTypesPage } from '@/pages/payment-types-page'
import { OrderCreatePage } from '@/pages/order-create-page'
import { PlaceholderPage } from '@/pages/placeholder-page'
import { PriceSettingsPage } from '@/pages/price-settings-page'
import { PriceSettingCreatePage } from '@/pages/price-setting-create-page'
import { PriceSettingEditPage } from '@/pages/price-setting-edit-page'

const menuRoutes = flattenSidebarRoutes()

const SETTINGS_PATH = 'sozlamalar/dastur'
const PRICE_SETTINGS_PATH = 'sozlamalar/narx'
const USERS_PATH = 'sozlamalar/foydalanuvchilar'
const PRODUCT_CATEGORIES_PATH = 'maxsulotlar/kategoriya'
const PRODUCT_BRANDS_PATH = 'maxsulotlar/brend'
const PRODUCTS_PATH = 'maxsulotlar/ro-yxat'
const PRODUCT_CREATE_PATH = 'maxsulotlar/ro-yxat/yaratish'
const PRODUCT_EDIT_PATH = 'maxsulotlar/ro-yxat/:id/tahrirlash'
const SUPPLIERS_PATH = 'yetkazib-beruvchilar/ro-yxat'
const SUPPLIER_CREATE_PATH = 'yetkazib-beruvchilar/ro-yxat/yaratish'
const SUPPLIER_DETAIL_PATH = 'yetkazib-beruvchilar/ro-yxat/:id'
const SUPPLIER_EDIT_PATH = 'yetkazib-beruvchilar/ro-yxat/:id/tahrirlash'
const WAREHOUSES_PATH = 'omborlar/ro-yxat'
const STOCK_RECEIPTS_PATH = 'omborlar/maxsulot-kirim'
const STOCK_RECEIPT_CREATE_PATH = 'omborlar/maxsulot-kirim/yaratish'
const STOCK_RECEIPT_DETAIL_PATH = 'omborlar/maxsulot-kirim/:id'
const STOCK_RECEIPT_ACCEPT_LIST_PATH = 'omborlar/kirim-qabul'
const STOCK_RECEIPT_ACCEPT_PATH = 'omborlar/kirim-qabul/:id'
const WAREHOUSE_STOCK_PATH = 'omborlar/maxsulotlar-soni'
const WAREHOUSE_STOCK_DETAIL_PATH = 'omborlar/maxsulotlar-soni/:id'
const PAYMENT_TYPES_PATH = 'to-lov/turlari'
const PAYMENT_TYPE_CREATE_PATH = 'to-lov/turlari/yaratish'
const PAYMENT_TYPE_EDIT_PATH = 'to-lov/turlari/:id/tahrirlash'
const USER_CREATE_PATH = 'sozlamalar/foydalanuvchilar/yaratish'
const USER_EDIT_PATH = 'sozlamalar/foydalanuvchilar/:id/tahrirlash'
const ORDER_CREATE_PATH = 'kassir/buyurtma-yaratish'
const PRICE_SETTING_CREATE_PATH = 'sozlamalar/narx/yaratish'
const PRICE_SETTING_EDIT_PATH = 'sozlamalar/narx/:id/tahrirlash'

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
              ) : route.path === PRICE_SETTINGS_PATH ? (
                <PriceSettingsPage />
              ) : route.path === USERS_PATH ? (
                <UsersPage />
              ) : route.path === PRODUCT_CATEGORIES_PATH ? (
                <ProductCategoriesPage />
              ) : route.path === PRODUCT_BRANDS_PATH ? (
                <ProductBrandsPage />
              ) : route.path === PRODUCTS_PATH ? (
                <ProductsPage />
              ) : route.path === SUPPLIERS_PATH ? (
                <SuppliersPage />
              ) : route.path === PAYMENT_TYPES_PATH ? (
                <PaymentTypesPage />
              ) : route.path === WAREHOUSES_PATH ? (
                <WarehousesPage />
              ) : route.path === STOCK_RECEIPTS_PATH ? (
                <StockReceiptsPage />
              ) : route.path === STOCK_RECEIPT_ACCEPT_LIST_PATH ? (
                <StockReceiptAcceptListPage />
              ) : route.path === ORDER_CREATE_PATH ? (
                <OrderCreatePage />
              ) : route.path === WAREHOUSE_STOCK_PATH ? (
                <WarehouseProductQuantitiesPage />
              ) : (
                <PlaceholderPage title={route.title} section={route.section} />
              ),
          })),
          {
            path: PAYMENT_TYPE_CREATE_PATH,
            element: <PaymentTypeCreatePage />,
          },
          {
            path: PAYMENT_TYPE_EDIT_PATH,
            element: <PaymentTypeEditPage />,
          },
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
          {
            path: SUPPLIER_CREATE_PATH,
            element: <SupplierCreatePage />,
          },
          {
            path: SUPPLIER_DETAIL_PATH,
            element: <SupplierDetailPage />,
          },
          {
            path: SUPPLIER_EDIT_PATH,
            element: <SupplierEditPage />,
          },
          {
            path: STOCK_RECEIPT_CREATE_PATH,
            element: <StockReceiptCreatePage />,
          },
          {
            path: STOCK_RECEIPT_DETAIL_PATH,
            element: <StockReceiptDetailPage />,
          },
          {
            path: STOCK_RECEIPT_ACCEPT_PATH,
            element: <StockReceiptAcceptPage />,
          },
          {
            path: WAREHOUSE_STOCK_DETAIL_PATH,
            element: <WarehouseStockDetailPage />,
          },
          {
            path: PRICE_SETTING_CREATE_PATH,
            element: <PriceSettingCreatePage />,
          },
          {
            path: PRICE_SETTING_EDIT_PATH,
            element: <PriceSettingEditPage />,
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
