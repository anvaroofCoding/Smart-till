import { ApiProperty } from '@nestjs/swagger';

export class WarehouseSalesSummaryDto {
  @ApiProperty()
  warehouseId: string;

  @ApiProperty()
  warehouseName: string;

  @ApiProperty()
  todaySales: number;

  @ApiProperty()
  yesterdaySales: number;

  @ApiProperty()
  monthSales: number;

  @ApiProperty({ description: 'Oylik savdo rejasi (so\'m)' })
  dailySalesPlan: number;

  @ApiProperty({ description: 'Oylik reja bajarilishi (%)' })
  monthPlanPercent: number;

  @ApiProperty({ description: 'Bugungi reja bajarilishi (%)' })
  todayPlanPercent: number;

  @ApiProperty({ description: 'Rejaga qolgan summa (manfiy = ortiqcha)' })
  planRemaining: number;
}

export class MonthlyWarehouseSalesDto {
  @ApiProperty()
  warehouseId: string;

  @ApiProperty()
  warehouseName: string;

  @ApiProperty()
  sales: number;
}

export class MonthlySalesReportDto {
  @ApiProperty({ example: '2024-02' })
  monthKey: string;

  @ApiProperty({ example: '02-2024' })
  monthLabel: string;

  @ApiProperty({ type: [MonthlyWarehouseSalesDto] })
  warehouses: MonthlyWarehouseSalesDto[];

  @ApiProperty()
  total: number;
}

export class SalesReportDto {
  @ApiProperty({ type: [WarehouseSalesSummaryDto] })
  summary: WarehouseSalesSummaryDto[];

  @ApiProperty({ type: [MonthlySalesReportDto] })
  monthly: MonthlySalesReportDto[];
}
