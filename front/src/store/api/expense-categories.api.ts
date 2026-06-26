import type { ApiResponse } from '@/types/api.types'
import type {
  ExpenseCategoryGroup,
  ExpenseCategoryRecord,
} from '@/types/daily-balance.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface CreateExpenseCategoryRequest {
  name: string
  parentId?: string
}

function normalizeExpenseCategoryGroups(
  response:
    | ApiResponse<ExpenseCategoryGroup[]>
    | ExpenseCategoryGroup[]
    | undefined,
): ExpenseCategoryGroup[] {
  const raw = Array.isArray(response) ? response : response?.data

  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map((group) => ({
    id: group.id,
    name: group.name,
    childrenCount: group.childrenCount ?? group.children?.length ?? 0,
    children: Array.isArray(group.children)
      ? group.children.map((child) => ({
          ...child,
          usageCount: child.usageCount ?? 0,
        }))
      : [],
  }))
}

export const expenseCategoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenseCategoryGroups: builder.query<ExpenseCategoryGroup[], void>({
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
    createExpenseCategory: builder.mutation<
      ExpenseCategoryRecord,
      CreateExpenseCategoryRequest
    >({
      query: (body) => ({
        url: '/expense-categories',
        method: 'POST',
        data: body,
      }),
      transformResponse: (
        response: ApiResponse<ExpenseCategoryRecord> | ExpenseCategoryRecord,
      ) =>
        'data' in response
          ? (response as ApiResponse<ExpenseCategoryRecord>).data
          : response,
      invalidatesTags: [{ type: API_TAGS.ExpenseCategory, id: 'LIST' }],
    }),
    deactivateExpenseCategory: builder.mutation<ExpenseCategoryRecord, string>({
      query: (id) => ({
        url: `/expense-categories/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (
        response: ApiResponse<ExpenseCategoryRecord> | ExpenseCategoryRecord,
      ) =>
        'data' in response
          ? (response as ApiResponse<ExpenseCategoryRecord>).data
          : response,
      invalidatesTags: [{ type: API_TAGS.ExpenseCategory, id: 'LIST' }],
    }),
  }),
})

export const {
  useGetExpenseCategoryGroupsQuery,
  useCreateExpenseCategoryMutation,
  useDeactivateExpenseCategoryMutation,
} = expenseCategoriesApi
