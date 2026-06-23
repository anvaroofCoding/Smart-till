import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { parseOptionalBoolean } from '../../common/utils/list-filter.utils';
import {
  RECEIPT_PAYMENT_TYPES,
  type ReceiptPaymentType,
} from '../constants/receipt-payment-types';
import {
  RECEIPT_STATUSES,
  type ReceiptStatus,
} from '../constants/receipt-status';

export class StockReceiptsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Kirim ID (qisman qidiruv)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Kirim nomi' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: RECEIPT_STATUSES })
  @IsOptional()
  @IsEnum(RECEIPT_STATUSES)
  status?: ReceiptStatus;

  @ApiPropertyOptional({ enum: RECEIPT_PAYMENT_TYPES })
  @IsOptional()
  @IsEnum(RECEIPT_PAYMENT_TYPES)
  paymentType?: ReceiptPaymentType;

  @ApiPropertyOptional({ description: 'Yetkazib beruvchi nomi' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Ombor nomi' })
  @IsOptional()
  @IsString()
  warehouseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  warehouseId?: string;

  @ApiPropertyOptional({
    description: 'Saqlangan sana (yyyy-MM-dd yoki dd.MM.yyyy)',
  })
  @IsOptional()
  @IsString()
  createdAt?: string;

  @ApiPropertyOptional({ description: 'Valyuta kursi' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional({ description: 'Umumiy narx' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({
    description: 'Yuborilgan kirimlar (true) yoki hali yuborilmagan (false)',
  })
  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  submitted?: boolean;
}
