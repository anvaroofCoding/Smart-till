import {
  ArrowLeftRight,
  ClipboardList,
  CreditCard,
  HandCoins,
  Package,
  Settings,
  Store,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

export interface SidebarSubItem {
  title: string
  url: string
}

export interface SidebarMenuItem {
  title: string
  url: string
  icon: LucideIcon
  items: SidebarSubItem[]
}

function sortByTitleUz<T extends { title: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.title.localeCompare(b.title, 'uz', { sensitivity: 'base' }),
  )
}

const sidebarMenuSource: SidebarMenuItem[] = [
  {
    title: 'Kassir',
    url: '/kassir',
    icon: HandCoins,
    items: [
      { title: 'Buyurtma yaratish', url: '/kassir/buyurtma-yaratish' },
      { title: 'Buyurtmalar', url: '/kassir/buyurtmalar' },
      { title: 'Buyurtmani chiqim qilish', url: '/kassir/buyurtmani-chiqim-qilish' },
      { title: 'Kunlik balanslar', url: '/kassir/kunlik-balanslar' },
      { title: 'Xarajatlar', url: '/kassir/xarajatlar' },
      { title: 'Kirimlar', url: '/kassir/kirimlar' },
      { title: 'Hisobotlar', url: '/kassir/hisobotlar' },
    ],
  },
  {
    title: 'Maxsulotlar',
    url: '/maxsulotlar',
    icon: Package,
    items: [
      { title: 'Maxsulotlar', url: '/maxsulotlar/ro-yxat' },
      { title: 'Maxsulot brendi', url: '/maxsulotlar/brend' },
      { title: 'Maxsulot kategoriyasi', url: '/maxsulotlar/kategoriya' },
    ],
  },
  {
    title: 'Omborlar',
    url: '/omborlar',
    icon: Warehouse,
    items: [
      { title: 'Maxsulotlar soni', url: '/omborlar/maxsulotlar-soni' },
      { title: "Omborlar ro'yxati", url: '/omborlar/ro-yxat' },
      { title: 'Kirimni qabul qilish', url: '/omborlar/kirim-qabul' },
      { title: 'Maxsulot kirim qilish', url: '/omborlar/maxsulot-kirim' },
    ],
  },
  {
    title: 'Transfer',
    url: '/transfer',
    icon: ArrowLeftRight,
    items: [
      { title: 'Transferlar', url: '/transfer/transferlar' },
      { title: 'Transferni qabul qilish', url: '/transfer/qabul-qilish' },
      { title: 'Transferni jo\'natish', url: '/transfer/jo-natish' },
    ],
  },
  {
    title: 'Sozlamalar',
    url: '/sozlamalar',
    icon: Settings,
    items: [
      { title: 'Narx sozlamalari', url: '/sozlamalar/narx' },
      { title: 'Foydalanuvchilar', url: '/sozlamalar/foydalanuvchilar' },
      { title: 'Dastur sozlamalari', url: '/sozlamalar/dastur' },
    ],
  },
  {
    title: 'Sotuvchilar',
    url: '/sotuvchilar',
    icon: Store,
    items: [
      { title: 'Maxsulotlar', url: '/sotuvchilar/maxsulotlar' },
      { title: 'Buyurtmalar', url: '/sotuvchilar/buyurtmalar' },
    ],
  },
  {
    title: "To'lov",
    url: '/to-lov',
    icon: CreditCard,
    items: [
      { title: "To'lov turlari", url: '/to-lov/turlari' },
    ],
  },
  {
    title: 'Inventarizatsiya',
    url: '/inventarizatsiya',
    icon: ClipboardList,
    items: [
      { title: "Inventarizatsiya ro'yxati", url: '/inventarizatsiya/ro-yxat' },
    ],
  },
  {
    title: 'Qarz',
    url: '/qarz',
    icon: Users,
    items: [
      { title: "Qarzdorlar ro'yxati", url: '/qarz/qarzdorlar' },
    ],
  },
  {
    title: 'Yetkazib beruvchilar',
    url: '/yetkazib-beruvchilar',
    icon: Truck,
    items: [
      { title: 'Yetkazib beruvchilar', url: '/yetkazib-beruvchilar/ro-yxat' },
    ],
  },
]

export const sidebarMenu: SidebarMenuItem[] = getDefaultSidebarMenu()

export function getDefaultSidebarMenu(): SidebarMenuItem[] {
  return sortByTitleUz(
    sidebarMenuSource.map((section) => ({
      ...section,
      items: sortByTitleUz(section.items),
    })),
  )
}

export function getSidebarSectionUrls(menu: SidebarMenuItem[] = getDefaultSidebarMenu()) {
  return menu.map((section) => section.url)
}

export function flattenSidebarRoutes() {
  return sidebarMenu.flatMap((section) =>
    section.items.map((item) => ({
      path: item.url.replace(/^\//, ''),
      title: item.title,
      section: section.title,
    })),
  )
}

export function findRouteMeta(pathname: string) {
  for (const section of sidebarMenu) {
    for (const item of section.items) {
      if (item.url === pathname) {
        return { section: section.title, title: item.title }
      }
    }
  }
  return null
}
