import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DailyBalance,
  DailyBalanceSchema,
} from '../daily-balances/schemas/daily-balance.schema';
import {
  Warehouse,
  WarehouseSchema,
} from '../warehouses/schemas/warehouse.schema';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyBalance.name, schema: DailyBalanceSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
