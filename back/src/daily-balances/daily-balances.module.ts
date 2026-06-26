import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpenseCategoriesModule } from '../expense-categories/expense-categories.module';
import { UsersModule } from '../users/users.module';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import {
  PaymentType,
  PaymentTypeSchema,
} from '../payment-types/schemas/payment-type.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Warehouse,
  WarehouseSchema,
} from '../warehouses/schemas/warehouse.schema';
import {
  ExpenseCategory,
  ExpenseCategorySchema,
} from '../expense-categories/schemas/expense-category.schema';
import { DailyBalancesController } from './daily-balances.controller';
import { DailyBalancesService } from './daily-balances.service';
import {
  DailyBalance,
  DailyBalanceSchema,
} from './schemas/daily-balance.schema';
import {
  DailyBalanceEntry,
  DailyBalanceEntrySchema,
} from './schemas/daily-balance-entry.schema';
import {
  MainBalance,
  MainBalanceSchema,
  MainBalanceTransfer,
  MainBalanceTransferSchema,
} from './schemas/main-balance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyBalance.name, schema: DailyBalanceSchema },
      { name: DailyBalanceEntry.name, schema: DailyBalanceEntrySchema },
      { name: MainBalance.name, schema: MainBalanceSchema },
      { name: MainBalanceTransfer.name, schema: MainBalanceTransferSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: ExpenseCategory.name, schema: ExpenseCategorySchema },
      { name: PaymentType.name, schema: PaymentTypeSchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    ExpenseCategoriesModule,
    UsersModule,
  ],
  controllers: [DailyBalancesController],
  providers: [DailyBalancesService],
  exports: [DailyBalancesService],
})
export class DailyBalancesModule {}
