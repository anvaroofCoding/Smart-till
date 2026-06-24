import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsMongoId()
  productId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  lineTotal: number;
}

export class CreateOrderPaymentDto {
  @ApiProperty()
  @IsMongoId()
  paymentTypeId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  paymentTypeName: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  installmentMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  installmentInterestPercent?: number;
}

export class CreateDraftOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerRegion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerDistrict?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerArea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ type: [CreateOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @ApiPropertyOptional({ type: [CreateOrderPaymentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderPaymentDto)
  payments?: CreateOrderPaymentDto[];
}

export class CreateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  customerPhone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerRegion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerDistrict?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerArea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ type: [CreateOrderPaymentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderPaymentDto)
  payments: CreateOrderPaymentDto[];
}

export class OrderItemResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productCode: string;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  lineTotal: number;
}

export class OrderPaymentResponseDto {
  @ApiProperty()
  paymentTypeId: string;

  @ApiProperty()
  paymentTypeName: string;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  installmentMonths?: number;

  @ApiPropertyOptional()
  installmentInterestPercent?: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  customerPhone: string;

  @ApiProperty()
  customerRegion: string;

  @ApiProperty()
  customerDistrict: string;

  @ApiProperty()
  customerArea: string;

  @ApiProperty()
  customerAddress: string;

  @ApiProperty()
  comment: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ type: [OrderPaymentResponseDto] })
  payments: OrderPaymentResponseDto[];

  @ApiProperty()
  itemsCount: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  discountTotal: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  paidTotal: number;

  @ApiProperty()
  remainingTotal: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  createdByName?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
