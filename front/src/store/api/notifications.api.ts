import type { PaginatedResponse } from '@/types/api.types'
import type {
  NotificationRecord,
  NotificationUnreadCount,
} from '@/types/notification.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      PaginatedResponse<NotificationRecord>,
      { page?: number; perPage?: number } | void
    >({
      query: (params) => ({
        url: '/notifications',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.Notification,
                id,
              })),
              { type: API_TAGS.Notification, id: 'LIST' },
              { type: API_TAGS.Notification, id: 'UNREAD' },
            ]
          : [
              { type: API_TAGS.Notification, id: 'LIST' },
              { type: API_TAGS.Notification, id: 'UNREAD' },
            ],
    }),
    getNotificationUnreadCount: builder.query<NotificationUnreadCount, void>({
      query: () => ({ url: '/notifications/unread-count' }),
      providesTags: [{ type: API_TAGS.Notification, id: 'UNREAD' }],
    }),
    markNotificationRead: builder.mutation<NotificationRecord | null, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.Notification, id },
        { type: API_TAGS.Notification, id: 'LIST' },
        { type: API_TAGS.Notification, id: 'UNREAD' },
      ],
    }),
    markAllNotificationsRead: builder.mutation<{ updated: number }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: [
        { type: API_TAGS.Notification, id: 'LIST' },
        { type: API_TAGS.Notification, id: 'UNREAD' },
      ],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi
