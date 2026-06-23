import { configureStore } from '@reduxjs/toolkit'
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from 'react-redux'
import { baseApi } from './api/base-api'
import { authReducer } from './slices/auth.slice'
import {
  setAuthTokenGetter,
  setOnUnauthorized,
} from '@/services/axios-client'
import { clearCredentials } from './slices/auth.slice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['api/executeQuery/fulfilled'],
      },
    }).concat(baseApi.middleware),
  devTools: import.meta.env.DEV,
})

setAuthTokenGetter(() => store.getState().auth.accessToken)
setOnUnauthorized(() => {
  store.dispatch(clearCredentials())
  store.dispatch(baseApi.util.resetApiState())
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
