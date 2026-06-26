import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DailyBalanceEntry,
  DailyBalanceEntrySchema,
} from '../daily-balances/schemas/daily-balance-entry.schema';
import {
  ExpenseCategory,
  ExpenseCategorySchema,
} from './schemas/expense-category.schema';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpenseCategoriesService } from './expense-categories.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExpenseCategory.name, schema: ExpenseCategorySchema },
      { name: DailyBalanceEntry.name, schema: DailyBalanceEntrySchema },
    ]),
  ],
  controllers: [ExpenseCategoriesController],
  providers: [ExpenseCategoriesService],
  exports: [ExpenseCategoriesService, MongooseModule],
})
export class ExpenseCategoriesModule {}
