import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PAYMENT_CHANNELS } from '../constants/payment-channel';

export class DailyBalanceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Kunlik balans ID (qisman qidiruv)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Kun (yyyy-MM-dd yoki dd.MM.yyyy)',
  })
  @IsOptional()
  @IsString()
  dateKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  warehouseId?: string;

  @ApiPropertyOptional({ enum: ['open', 'closed'] })
  @IsOptional()
  @IsIn(['open', 'closed'])
  status?: 'open' | 'closed';

  @ApiPropertyOptional({ description: 'Kirim summasi' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  income?: number;

  @ApiPropertyOptional({ description: 'Chiqim summasi' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  expense?: number;

  @ApiPropertyOptional({ description: 'Asosiy balansga o\'tkazilgan summa' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  transferredToMain?: number;

  @ApiPropertyOptional({
    description: 'Saqlangan sana (yyyy-MM-dd yoki dd.MM.yyyy)',
  })
  @IsOptional()
  @IsString()
  savedAt?: string;
}

export class DailyBalanceEntryQueryDto {
  @ApiPropertyOptional({ enum: ['sale', 'manual_income', 'expense'] })
  @IsOptional()
  @IsString()
  type?: 'sale' | 'manual_income' | 'expense';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  perPage?: number;
}

export class AddManualIncomeDto {
  @ApiProperty({ enum: PAYMENT_CHANNELS })
  @IsEnum(PAYMENT_CHANNELS)
  channel: (typeof PAYMENT_CHANNELS)[number];

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AddExpenseDto {
  @ApiProperty()
  @IsMongoId()
  expenseCategoryId: string;

  @ApiProperty({ example: 290000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AddCashToMainDto {
  @ApiProperty({ example: 500000, description: 'Asosiy balansga o\'tkaziladigan naqd summa' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: "Do'kon" })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ description: 'Asosiy tur ID (ichki tur uchun)' })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}

export class DailyBalanceTotalsDto {
  @ApiProperty() salesCash: number;
  @ApiProperty() salesTerminal: number;
  @ApiProperty() salesCard: number;
  @ApiProperty() salesTotal: number;
  @ApiProperty() manualIncomeCash: number;
  @ApiProperty() manualIncomeTerminal: number;
  @ApiProperty() manualIncomeCard: number;
  @ApiProperty() manualIncomeTotal: number;
  @ApiProperty() incomeTotal: number;
  @ApiProperty() expenseTotal: number;
  @ApiProperty() netTotal: number;
}

export class DailyBalanceEntryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() type: string;
  @ApiPropertyOptional() channel?: string;
  @ApiProperty() amount: number;
  @ApiProperty() note: string;
  @ApiPropertyOptional() expenseCategoryId?: string;
  @ApiProperty() expenseCategoryName: string;
  @ApiPropertyOptional() orderId?: string;
  @ApiProperty() orderLabel: string;
  @ApiProperty() createdAt: Date;
}

export class DailyBalanceEntryListItemDto extends DailyBalanceEntryResponseDto {
  @ApiProperty() dailyBalanceId: string;
  @ApiProperty() dateKey: string;
  @ApiProperty() warehouseId: string;
  @ApiProperty() warehouseName: string;
}

export class DailyBalanceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() dateKey: string;
  @ApiProperty() warehouseId: string;
  @ApiProperty() warehouseName: string;
  @ApiProperty() status: string;
  @ApiProperty({ type: DailyBalanceTotalsDto }) totals: DailyBalanceTotalsDto;
  @ApiProperty() transferredToMain: number;
  @ApiPropertyOptional() closedAt?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class DailyBalanceDetailResponseDto extends DailyBalanceResponseDto {
  @ApiProperty({ type: [DailyBalanceEntryResponseDto] })
  incomes: DailyBalanceEntryResponseDto[];

  @ApiProperty({ type: [DailyBalanceEntryResponseDto] })
  expenses: DailyBalanceEntryResponseDto[];

  @ApiProperty({ type: [DailyBalanceEntryResponseDto] })
  mainDeposits: DailyBalanceEntryResponseDto[];

  @ApiProperty({ description: 'Bugungi naqd pul (savdo + kirim)' })
  todayCashTotal: number;

  @ApiProperty({ description: 'Asosiy balansga o\'tkazish uchun mavjud naqd' })
  availableCashForDeposit: number;
}

export class MainBalanceResponseDto {
  @ApiProperty() total: number;
}

export class MainBalanceTransferResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() dailyBalanceId: string;
  @ApiProperty() warehouseId: string;
  @ApiProperty() warehouseName: string;
  @ApiProperty() dateKey: string;
  @ApiProperty() amount: number;
  @ApiProperty() mainBalanceBefore: number;
  @ApiProperty() mainBalanceAfter: number;
  @ApiProperty() createdAt: Date;
}

export class ExpenseCategoryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() parentId?: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ description: 'Tranzaksiyalarda ishlatilgan soni' })
  usageCount: number;
}

export class ExpenseCategoryGroupDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ description: 'Ichki xarajat turlari soni' })
  childrenCount: number;
  @ApiProperty({ type: [ExpenseCategoryResponseDto] })
  children: ExpenseCategoryResponseDto[];
}
