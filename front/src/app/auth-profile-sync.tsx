import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { useGetMeQuery } from '@/store/api'
import {
  clearCredentials,
  selectIsAuthenticated,
  updateUser,
} from '@/store/slices/auth.slice'

export function AuthProfileSync() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const meQuery = useGetMeQuery(undefined, { skip: !isAuthenticated })

  useEffect(() => {
    if (!isAuthenticated) return

    if (meQuery.isSuccess && meQuery.data?.user) {
      dispatch(updateUser(meQuery.data.user))
      return
    }

    if (meQuery.isError) {
      dispatch(clearCredentials())
    }
  }, [
    dispatch,
    isAuthenticated,
    meQuery.data?.user,
    meQuery.isError,
    meQuery.isSuccess,
  ])

  return null
}
