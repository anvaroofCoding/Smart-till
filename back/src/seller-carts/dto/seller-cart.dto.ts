import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SellerCartItemDto {
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

  @ApiProperty()
  @IsNumber()
  @Min(0)
  lineTotal: number;
}

export class AddSellerCartItemDto {
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

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;
}

export class UpdateSellerCartItemDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class SellerCartItemResponseDto {
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
  lineTotal: number;
}

export class SellerCartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cardNumber: string;

  @ApiProperty()
  sellerId: string;

  @ApiPropertyOptional()
  sellerName?: string;

  @ApiPropertyOptional()
  warehouseId?: string;

  @ApiProperty({ type: [SellerCartItemResponseDto] })
  items: SellerCartItemResponseDto[];

  @ApiProperty()
  itemsCount: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  claimedOrderId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SellerCartListResponseDto {
  @ApiProperty({ type: [SellerCartResponseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerCartResponseDto)
  data: SellerCartResponseDto[];
}
