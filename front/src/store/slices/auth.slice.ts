import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/types/api.types'
import { getStoredAccessToken, setStoredAccessToken } from '@/services/axios-client'

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: getStoredAccessToken(),
  isAuthenticated: Boolean(getStoredAccessToken()),
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string }>,
    ) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
      setStoredAccessToken(action.payload.accessToken)
    },
    clearCredentials: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      setStoredAccessToken(null)
    },
    updateUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload
    },
  },
})

export const { setCredentials, clearCredentials, updateUser } = authSlice.actions
export const authReducer = authSlice.reducer

export const selectAuth = (state: { auth: AuthState }) => state.auth
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated
