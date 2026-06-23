import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '@/config/env'
import type { ApiErrorBody } from '@/types/api.types'

const TOKEN_STORAGE_KEY = 'warehouse_access_token'

let authTokenGetter: (() => string | null) | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthTokenGetter(getter: () => string | null) {
  authTokenGetter = getter
}

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

function attachAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = authTokenGetter?.() ?? getStoredAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

    instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorBody>) => {
      const status = error.response?.status
      if (status === 401) {
        onUnauthorized?.()
      }
      return Promise.reject(error)
    },
  )
}

export const axiosClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 30_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

attachAuthInterceptor(axiosClient)

export async function axiosBaseQuery<T>(
  config: AxiosRequestConfig,
): Promise<{ data: T } | { error: ApiErrorBody }> {
  try {
    const response = await axiosClient.request<T>(config)
    return { data: response.data }
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorBody>
    const responseData = axiosError.response?.data
    const status = axiosError.response?.status ?? 500
    const responseMessage =
      responseData && typeof responseData === 'object'
        ? Array.isArray(responseData.message)
          ? responseData.message.join(', ')
          : typeof responseData.message === 'string'
            ? responseData.message
            : undefined
        : undefined

    return {
      error: {
        status,
        statusCode: status,
        message: responseMessage ?? axiosError.message,
        error: responseData?.error ?? 'NetworkError',
      },
    }
  }
}
