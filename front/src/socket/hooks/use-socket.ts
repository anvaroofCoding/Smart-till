import { useEffect } from 'react'
import { useSocketContext } from '../socket-provider'
import {
  CLIENT_EVENTS,
  SOCKET_EVENTS,
  type InventoryScannedPayload,
  type InventoryUpdatedPayload,
  type StockLowPayload,
  type WarehouseAlertPayload,
} from '../socket-events'

export function useSocket() {
  return useSocketContext()
}

export function useSocketEvent<E extends keyof import('@/types/socket.types').ServerToClientEvents>(
  event: E,
  handler: import('@/types/socket.types').ServerToClientEvents[E],
  enabled = true,
) {
  const { socket } = useSocketContext()

  useEffect(() => {
    if (!enabled) return

    socket.on(event, handler as never)
    return () => {
      socket.off(event, handler as never)
    }
  }, [socket, event, handler, enabled])
}

export function useWarehouseSocket(warehouseId?: string) {
  const { socket, isConnected } = useSocketContext()

  useEffect(() => {
    if (!isConnected) return

    socket.emit(CLIENT_EVENTS.INVENTORY_SUBSCRIBE, { warehouseId })

    return () => {
      socket.emit(CLIENT_EVENTS.INVENTORY_UNSUBSCRIBE)
    }
  }, [socket, isConnected, warehouseId])

  return { socket, isConnected }
}

export function useInventoryRealtime(options?: {
  onUpdated?: (payload: InventoryUpdatedPayload) => void
  onScanned?: (payload: InventoryScannedPayload) => void
  onStockLow?: (payload: StockLowPayload) => void
  onAlert?: (payload: WarehouseAlertPayload) => void
}) {
  useSocketEvent(
    SOCKET_EVENTS.INVENTORY_UPDATED,
    options?.onUpdated ?? (() => {}),
    Boolean(options?.onUpdated),
  )
  useSocketEvent(
    SOCKET_EVENTS.INVENTORY_SCANNED,
    options?.onScanned ?? (() => {}),
    Boolean(options?.onScanned),
  )
  useSocketEvent(
    SOCKET_EVENTS.STOCK_LOW,
    options?.onStockLow ?? (() => {}),
    Boolean(options?.onStockLow),
  )
  useSocketEvent(
    SOCKET_EVENTS.WAREHOUSE_ALERT,
    options?.onAlert ?? (() => {}),
    Boolean(options?.onAlert),
  )
}
