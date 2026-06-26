import type { ApiResponse } from '@/types/api.types'
import type { SalesReport } from '@/types/reports.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSalesReport: builder.query<SalesReport, void>({
      query: () => ({
        url: '/reports/sales',
        method: 'GET',
      }),
      transformResponse: (
        response: ApiResponse<SalesReport> | SalesReport,
      ) =>
        'data' in response && response.data && typeof response.data === 'object'
          ? response.data
          : (response as SalesReport),
      providesTags: [{ type: API_TAGS.Order, id: 'SALES_REPORT' }],
    }),
  }),
})

export const { useGetSalesReportQuery } = reportsApi
