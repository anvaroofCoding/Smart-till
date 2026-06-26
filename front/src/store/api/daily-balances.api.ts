import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  AddCashToMainRequest,
  AddExpenseRequest,
  AddManualIncomeRequest,
  DailyBalanceDetailRecord,
  DailyBalanceEntryListItem,
  DailyBalanceRecord,
  ExpenseCategoryGroup,
  MainBalanceRecord,
  MainBalanceTransferRecord,
} from '@/types/daily-balance.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface DailyBalancesQueryParams {
  page?: number
  perPage?: number
  id?: string
  dateKey?: string
  warehouseId?: string
  status?: string
  income?: number
  expense?: number
  transferredToMain?: number
  savedAt?: string
}

export interface DailyBalanceEntriesQueryParams {
  page?: number
  perPage?: number
  type?: 'sale' | 'manual_income' | 'expense'
}

function normalizeExpenseCategoryGroups(
  response:
    | ApiResponse<ExpenseCategoryGroup[]>
    | ExpenseCategoryGroup[]
    | undefined,
): ExpenseCategoryGroup[] {
  const raw = Array.isArray(response)
    ? response
    : response?.data

  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map((group) => ({
    id: group.id,
    name: group.name,
    children: Array.isArray(group.children) ? group.children : [],
  }))
}

export const dailyBalancesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDailyBalances: builder.query<
      PaginatedResponse<DailyBalanceRecord>,
      DailyBalancesQueryParams | void
    >({
      query: (params) => ({
        url: '/daily-balances',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<PaginatedResponse<DailyBalanceRecord>>
          | PaginatedResponse<DailyBalanceRecord>,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as PaginatedResponse<DailyBalanceRecord>)
          : (response as ApiResponse<PaginatedResponse<DailyBalanceRecord>>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.DailyBalance,
                id,
              })),
              { type: API_TAGS.DailyBalance, id: 'LIST' },
            ]
          : [{ type: API_TAGS.DailyBalance, id: 'LIST' }],
    }),
    getDailyBalance: builder.query<DailyBalanceDetailRecord, string>({
      query: (id) => ({
        url: `/daily-balances/${id}`,
        method: 'GET',
      }),
      transformResponse: (
        response: ApiResponse<DailyBalanceDetailRecord> | DailyBalanceDetailRecord,
      ) =>
        'data' in response
          ? (response as ApiResponse<DailyBalanceDetailRecord>).data
          : response,
      providesTags: (_result, _error, id) => [{ type: API_TAGS.DailyBalance, id }],
    }),
    getMainBalance: builder.query<MainBalanceRecord, void>({
      query: () => ({
        url: '/daily-balances/main-balance',
        method: 'GET',
      }),
      transformResponse: (
        response: ApiResponse<MainBalanceRecord> | MainBalanceRecord,
      ) =>
        'data' in response
          ? (response as ApiResponse<MainBalanceRecord>).data
          : response,
      providesTags: [{ type: API_TAGS.DailyBalance, id: 'MAIN' }],
    }),
    getMainBalanceTransfers: builder.query<
      PaginatedResponse<MainBalanceTransferRecord>,
      { page?: number; perPage?: number } | void
    >({
      query: (params) => ({
        url: '/daily-balances/transfers',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<PaginatedResponse<MainBalanceTransferRecord>>
          | PaginatedResponse<MainBalanceTransferRecord>,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as PaginatedResponse<MainBalanceTransferRecord>)
          : (response as ApiResponse<PaginatedResponse<MainBalanceTransferRecord>>)
              .data,
      providesTags: [{ type: API_TAGS.DailyBalance, id: 'TRANSFERS' }],
    }),
    getDailyBalanceEntries: builder.query<
      PaginatedResponse<DailyBalanceEntryListItem>,
      DailyBalanceEntriesQueryParams | void
    >({
      query: (params) => ({
        url: '/daily-balances/entries',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<PaginatedResponse<DailyBalanceEntryListItem>>
          | PaginatedResponse<DailyBalanceEntryListItem>,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as PaginatedResponse<DailyBalanceEntryListItem>)
          : (response as ApiResponse<PaginatedResponse<DailyBalanceEntryListItem>>)
              .data,
      providesTags: [{ type: API_TAGS.DailyBalance, id: 'ENTRIES' }],
    }),
    addDailyBalanceIncome: builder.mutation<
      DailyBalanceDetailRecord,
      { id: string; body: AddManualIncomeRequest }
    >({
      query: ({ id, body }) => ({
        url: `/daily-balances/${id}/income`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (
        response: ApiResponse<DailyBalanceDetailRecord> | DailyBalanceDetailRecord,
      ) =>
        'data' in response
          ? (response as ApiResponse<DailyBalanceDetailRecord>).data
          : response,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.DailyBalance, id },
        { type: API_TAGS.DailyBalance, id: 'LIST' },
        { type: API_TAGS.DailyBalance, id: 'MAIN' },
        { type: API_TAGS.DailyBalance, id: 'ENTRIES' },
        { type: API_TAGS.Order, id: 'SALES_REPORT' },
      ],
    }),
    addDailyBalanceExpense: builder.mutation<
      DailyBalanceDetailRecord,
      { id: string; body: AddExpenseRequest }
    >({
      query: ({ id, body }) => ({
        url: `/daily-balances/${id}/expense`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (
        response: ApiResponse<DailyBalanceDetailRecord> | DailyBalanceDetailRecord,
      ) =>
        'data' in response
          ? (response as ApiResponse<DailyBalanceDetailRecord>).data
          : response,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.DailyBalance, id },
        { type: API_TAGS.DailyBalance, id: 'LIST' },
        { type: API_TAGS.DailyBalance, id: 'MAIN' },
        { type: API_TAGS.DailyBalance, id: 'ENTRIES' },
        { type: API_TAGS.DailyBalance, id: 'TRANSFERS' },
        { type: API_TAGS.Order, id: 'SALES_REPORT' },
      ],
    }),
    depositCashToMain: builder.mutation<
      DailyBalanceDetailRecord,
      { id: string; body: AddCashToMainRequest }
    >({
      query: ({ id, body }) => ({
        url: `/daily-balances/${id}/deposit-main`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (
        response: ApiResponse<DailyBalanceDetailRecord> | DailyBalanceDetailRecord,
      ) =>
        'data' in response
          ? (response as ApiResponse<DailyBalanceDetailRecord>).data
          : response,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.DailyBalance, id },
        { type: API_TAGS.DailyBalance, id: 'LIST' },
        { type: API_TAGS.DailyBalance, id: 'MAIN' },
        { type: API_TAGS.DailyBalance, id: 'ENTRIES' },
        { type: API_TAGS.DailyBalance, id: 'TRANSFERS' },
      ],
    }),
    getExpenseCategories: builder.query<ExpenseCategoryGroup[], void>({
      query: () => ({
        url: '/expense-categories',
        method: 'GET',
      }),
      transformResponse: (
        response:
          | ApiResponse<ExpenseCategoryGroup[]>
          | ExpenseCategoryGroup[],
      ) => normalizeExpenseCategoryGroups(response),
      providesTags: [{ type: API_TAGS.ExpenseCategory, id: 'LIST' }],
    }),
  }),
})

export const {
  useGetDailyBalancesQuery,
  useGetDailyBalanceQuery,
  useGetMainBalanceQuery,
  useGetMainBalanceTransfersQuery,
  useGetDailyBalanceEntriesQuery,
  useAddDailyBalanceIncomeMutation,
  useAddDailyBalanceExpenseMutation,
  useDepositCashToMainMutation,
  useGetExpenseCategoriesQuery,
} = dailyBalancesApi
