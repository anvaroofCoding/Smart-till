import {
  createApi,
  type BaseQueryFn,
} from '@reduxjs/toolkit/query/react'
import type { AxiosRequestConfig } from 'axios'
import { axiosBaseQuery } from '@/services/axios-client'
import type { ApiErrorBody } from '@/types/api.types'
import { tagTypes } from './api-tags'

type AxiosBaseQueryArgs = AxiosRequestConfig
type AxiosBaseQueryError = ApiErrorBody

const axiosQuery: BaseQueryFn<
  AxiosBaseQueryArgs,
  unknown,
  AxiosBaseQueryError
> = async (args) => {
  const result = await axiosBaseQuery<unknown>(args)
  if ('error' in result) {
    return { error: result.error }
  }
  return { data: result.data }
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosQuery,
  tagTypes,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  keepUnusedDataFor: 60,
  endpoints: () => ({}),
})
