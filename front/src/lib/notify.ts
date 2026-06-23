import { toast } from '@/hooks/use-toast'

type NotifyOptions = {
  title?: string
}

export const notify = {
  success(message: string, options?: NotifyOptions) {
    toast({
      variant: 'success',
      title: options?.title ?? 'Muvaffaqiyat',
      description: message,
    })
  },

  error(message: string, options?: NotifyOptions) {
    toast({
      variant: 'destructive',
      title: options?.title ?? 'Xatolik',
      description: message,
    })
  },
}
