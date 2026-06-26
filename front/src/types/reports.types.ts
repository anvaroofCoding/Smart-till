export interface WarehouseSalesSummary {
  warehouseId: string
  warehouseName: string
  todaySales: number
  yesterdaySales: number
  monthSales: number
  dailySalesPlan: number
  monthPlanPercent: number
  todayPlanPercent: number
  planRemaining: number
}

export interface MonthlyWarehouseSales {
  warehouseId: string
  warehouseName: string
  sales: number
}

export interface MonthlySalesReport {
  monthKey: string
  monthLabel: string
  warehouses: MonthlyWarehouseSales[]
  total: number
}

export interface SalesReport {
  summary: WarehouseSalesSummary[]
  monthly: MonthlySalesReport[]
}
