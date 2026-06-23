import { io, type Socket } from 'socket.io-client'
import { env } from '@/config/env'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/types/socket.types'

export type WarehouseSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socketInstance: WarehouseSocket | null = null

export function getSocket(): WarehouseSocket {
  if (!socketInstance) {
    socketInstance = io(env.wsUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
    })
  }
  return socketInstance
}

export function connectSocket(): WarehouseSocket {
  const socket = getSocket()
  if (!socket.connected) {
    socket.connect()
  }
  return socket
}

export function disconnectSocket(): void {
  if (socketInstance?.connected) {
    socketInstance.disconnect()
  }
}

export function destroySocket(): void {
  if (socketInstance) {
    socketInstance.removeAllListeners()
    socketInstance.disconnect()
    socketInstance = null
  }
}
