import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  RECEIPT_PAYMENT_TYPES,
  type ReceiptPaymentType,
} from '../constants/receipt-payment-types';
import {
  RECEIPT_STATUSES,
  type ReceiptStatus,
} from '../constants/receipt-status';

export class CreateStockReceiptDto {
  @ApiProperty({ example: 'Mart oyi kirimi' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ enum: RECEIPT_PAYMENT_TYPES, example: 'cash' })
  @IsEnum(RECEIPT_PAYMENT_TYPES)
  paymentType: ReceiptPaymentType;

  @ApiProperty()
  @IsMongoId()
  supplierId: string;

  @ApiProperty()
  @IsMongoId()
  warehouseId: string;

  @ApiProperty({ example: 12850.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  exchangeRate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStockReceiptDto extends PartialType(CreateStockReceiptDto) {}

export class AddStockReceiptItemDto {
  @ApiProperty()
  @IsMongoId()
  productId: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 125000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}

export class UpdateStockReceiptItemDto {
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity?: number;

  @ApiPropertyOptional({ example: 125000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number;
}

export class StockReceiptRelationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class StockReceiptItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;
}

export class StockReceiptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: RECEIPT_PAYMENT_TYPES })
  paymentType: ReceiptPaymentType;

  @ApiProperty({ type: StockReceiptRelationDto })
  supplier: StockReceiptRelationDto;

  @ApiProperty({ type: StockReceiptRelationDto })
  warehouse: StockReceiptRelationDto;

  @ApiProperty()
  exchangeRate: number;

  @ApiProperty()
  notes: string;

  @ApiProperty({ enum: RECEIPT_STATUSES })
  status: ReceiptStatus;

  @ApiProperty({ type: [StockReceiptItemResponseDto] })
  items: StockReceiptItemResponseDto[];

  @ApiProperty()
  itemsCount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
