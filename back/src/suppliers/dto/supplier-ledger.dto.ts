import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateSupplierLedgerEntryDto {
  @ApiPropertyOptional({ example: 1_000_000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountUzs?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountUsd?: number;
}

export class SupplierLedgerEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entryNumber: number;

  @ApiProperty()
  paymentUzs: number;

  @ApiProperty()
  paymentUsd: number;

  @ApiProperty()
  debtUzs: number;

  @ApiProperty()
  debtUsd: number;

  @ApiProperty()
  createdAt: Date;
}

export class SupplierLedgerSummaryDto {
  @ApiProperty()
  totalPaymentUzs: number;

  @ApiProperty()
  totalPaymentUsd: number;

  @ApiProperty()
  totalDebtUzs: number;

  @ApiProperty()
  totalDebtUsd: number;

  @ApiProperty()
  netDebtUzs: number;

  @ApiProperty()
  netDebtUsd: number;
}

export class SupplierLedgerListResponseDto {
  @ApiProperty({ type: [SupplierLedgerEntryResponseDto] })
  data: SupplierLedgerEntryResponseDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };

  @ApiProperty({ type: SupplierLedgerSummaryDto })
  summary: SupplierLedgerSummaryDto;
}
