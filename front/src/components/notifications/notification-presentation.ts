import type { AppIconName } from '@/components/icons/icon.types'
import type { NotificationType } from '@/types/notification.types'

export interface NotificationPresentation {
  icon: AppIconName
  label: string
  accentClass: string
  iconClass: string
  borderClass: string
}

const presentations: Record<NotificationType, NotificationPresentation> = {
  stock_receipt_accepted: {
    icon: 'check',
    label: 'Kirim',
    accentClass: 'text-emerald-700 dark:text-emerald-400',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/40',
  },
  stock_receipt_partial: {
    icon: 'package',
    label: 'Kirim (qisman)',
    accentClass: 'text-amber-700 dark:text-amber-400',
    iconClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/40',
  },
  warehouse_transfer_sent: {
    icon: 'truck',
    label: 'Transfer yuborildi',
    accentClass: 'text-sky-700 dark:text-sky-400',
    iconClass: 'text-sky-600 dark:text-sky-400',
    borderClass: 'border-sky-500/40',
  },
  warehouse_transfer_accepted: {
    icon: 'check',
    label: 'Transfer qabul qilindi',
    accentClass: 'text-emerald-700 dark:text-emerald-400',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/40',
  },
  warehouse_transfer_partial: {
    icon: 'truck',
    label: 'Transfer (qisman)',
    accentClass: 'text-amber-700 dark:text-amber-400',
    iconClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/40',
  },
}

export function getNotificationPresentation(
  type: NotificationType,
): NotificationPresentation {
  return presentations[type] ?? {
    icon: 'bell',
    label: 'Bildirishnoma',
    accentClass: 'text-foreground',
    iconClass: 'text-primary',
    borderClass: 'border-border',
  }
}
