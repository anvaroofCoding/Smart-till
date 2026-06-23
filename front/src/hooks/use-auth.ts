import { useCallback } from 'react'
import { useLoginMutation, useGetMeQuery, useLazyGetMeQuery } from '@/store/api'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  clearCredentials,
  selectAuth,
  selectCurrentUser,
  selectIsAuthenticated,
  setCredentials,
} from '@/store/slices/auth.slice'
import type { LoginRequest } from '@/types/api.types'

export function useAuth() {
  const dispatch = useAppDispatch()
  const auth = useAppSelector(selectAuth)
  const user = useAppSelector(selectCurrentUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  const [loginMutation, loginState] = useLoginMutation()
  const [fetchMe] = useLazyGetMeQuery()
  const meQuery = useGetMeQuery(undefined, { skip: !isAuthenticated })

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const result = await loginMutation(credentials).unwrap()
      dispatch(
        setCredentials({
          user: result.user,
          accessToken: result.tokens.accessToken,
        }),
      )
      return result
    },
    [dispatch, loginMutation],
  )

  const logout = useCallback(() => {
    dispatch(clearCredentials())
  }, [dispatch])

  const refreshProfile = useCallback(async () => {
    const result = await fetchMe().unwrap()
    return result.user
  }, [fetchMe])

  return {
    auth,
    user: meQuery.data?.user ?? user,
    isAuthenticated,
    login,
    logout,
    refreshProfile,
    isLoggingIn: loginState.isLoading,
    loginError: loginState.error,
  }
}
