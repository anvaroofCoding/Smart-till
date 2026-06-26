import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { queryClient } from '@/query/query-client'
import { queryKeys } from '@/query/query-keys'
import { store, useAppSelector } from '@/store'
import { API_TAGS, baseApi } from '@/store/api'
import { selectIsAuthenticated } from '@/store/slices/auth.slice'
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  type WarehouseSocket,
} from './socket-client'
import { SOCKET_EVENTS } from './socket-events'

interface SocketContextValue {
  socket: WarehouseSocket
  isConnected: boolean
}

const SocketContext = createContext<SocketContextValue | null>(null)

function invalidateCachesOnRealtimeEvent() {
  void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
  void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() })

  store.dispatch(
    baseApi.util.invalidateTags([
      { type: API_TAGS.Inventory, id: 'LIST' },
      { type: API_TAGS.Order, id: 'LIST' },
    ]),
  )
}

function invalidateNotificationCaches() {
  store.dispatch(
    baseApi.util.invalidateTags([
      { type: API_TAGS.Notification, id: 'LIST' },
      { type: API_TAGS.Notification, id: 'UNREAD' },
    ]),
  )
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const [isConnected, setIsConnected] = useState(false)
  const socket = useMemo(() => getSocket(), [])

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket()
      setIsConnected(false)
      return
    }

    const activeSocket = connectSocket()
    setIsConnected(activeSocket.connected)

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    activeSocket.on('connect', handleConnect)
    activeSocket.on('disconnect', handleDisconnect)
    activeSocket.on(SOCKET_EVENTS.INVENTORY_UPDATED, invalidateCachesOnRealtimeEvent)
    activeSocket.on(SOCKET_EVENTS.INVENTORY_SCANNED, invalidateCachesOnRealtimeEvent)
    activeSocket.on(SOCKET_EVENTS.STOCK_LOW, invalidateCachesOnRealtimeEvent)
    activeSocket.on(SOCKET_EVENTS.ORDER_CREATED, invalidateCachesOnRealtimeEvent)
    activeSocket.on(SOCKET_EVENTS.ORDER_UPDATED, invalidateCachesOnRealtimeEvent)
    activeSocket.on(SOCKET_EVENTS.NOTIFICATION_CREATED, invalidateNotificationCaches)

    return () => {
      activeSocket.off('connect', handleConnect)
      activeSocket.off('disconnect', handleDisconnect)
      activeSocket.off(SOCKET_EVENTS.INVENTORY_UPDATED, invalidateCachesOnRealtimeEvent)
      activeSocket.off(SOCKET_EVENTS.INVENTORY_SCANNED, invalidateCachesOnRealtimeEvent)
      activeSocket.off(SOCKET_EVENTS.STOCK_LOW, invalidateCachesOnRealtimeEvent)
      activeSocket.off(SOCKET_EVENTS.ORDER_CREATED, invalidateCachesOnRealtimeEvent)
      activeSocket.off(SOCKET_EVENTS.ORDER_UPDATED, invalidateCachesOnRealtimeEvent)
      activeSocket.off(SOCKET_EVENTS.NOTIFICATION_CREATED, invalidateNotificationCaches)
    }
  }, [isAuthenticated])

  const value = useMemo(
    () => ({ socket, isConnected }),
    [socket, isConnected],
  )

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  )
}

export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider')
  }
  return context
}
