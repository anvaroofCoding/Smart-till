import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WarehouseStockRelationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class WarehouseStockProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ example: '2000000000012' })
  barcode: string;

  @ApiProperty({ type: [String], example: ['2000000000012', '8690000000012'] })
  barcodes: string[];

  @ApiProperty({ type: WarehouseStockRelationDto })
  category: WarehouseStockRelationDto;

  @ApiProperty({ type: WarehouseStockRelationDto })
  brand: WarehouseStockRelationDto;
}

export class WarehouseStockListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: WarehouseStockProductDto })
  product: WarehouseStockProductDto;

  @ApiProperty({ type: WarehouseStockRelationDto })
  warehouse: WarehouseStockRelationDto;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ description: 'Oxirgi kirim birlik narxi' })
  unitPrice: number;

  @ApiProperty()
  exchangeRate: number;

  @ApiProperty()
  totalValue: number;

  @ApiProperty({ description: 'Sotiladigan narx (foyda qo\'shilgan)' })
  sellingPrice: number;

  @ApiPropertyOptional({ description: 'Qo\'llangan foyda foizi (%)' })
  markupPercent?: number;

  @ApiProperty()
  updatedAt: Date;
}

export class StockMovementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sourceType: string;

  @ApiProperty()
  sourceName: string;

  @ApiPropertyOptional()
  sourceId?: string;

  @ApiProperty({ type: WarehouseStockRelationDto })
  supplier: WarehouseStockRelationDto;

  @ApiProperty({ type: WarehouseStockRelationDto })
  warehouse: WarehouseStockRelationDto;

  @ApiProperty()
  delta: number;

  @ApiProperty()
  balanceAfter: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  exchangeRate: number;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  notes: string;

  @ApiProperty()
  createdAt: Date;
}

export class WarehouseStockDetailDto extends WarehouseStockListItemDto {
  @ApiProperty({ type: [StockMovementResponseDto] })
  movements: StockMovementResponseDto[];

  @ApiProperty({
    description: 'Turli kirim narxlari mavjudligi',
  })
  hasMixedUnitPrices: boolean;

  @ApiProperty({
    type: [Number],
    description: 'Oxirgi narxdan farqli oldingi kirim narxlari',
  })
  previousUnitPrices: number[];
}
