import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateWarehouseTransferItemDto {
  @ApiProperty()
  @IsMongoId()
  productId: string;

  @ApiProperty({ minimum: 0.001 })
  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class CreateWarehouseTransferDraftDto {
  @ApiProperty()
  @IsMongoId()
  fromWarehouseId: string;

  @ApiProperty({ example: 'Do\'konga maxsulot' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty()
  @IsMongoId()
  toWarehouseId: string;

  @ApiPropertyOptional({ example: '2026-06-25' })
  @IsOptional()
  @IsDateString()
  transferDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ type: [CreateWarehouseTransferItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWarehouseTransferItemDto)
  items?: CreateWarehouseTransferItemDto[];
}

export class UpdateWarehouseTransferDraftDto {
  @ApiProperty({ type: [CreateWarehouseTransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWarehouseTransferItemDto)
  items: CreateWarehouseTransferItemDto[];
}

export class SendWarehouseTransferDraftDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  toWarehouseId?: string;

  @ApiPropertyOptional({ example: '2026-06-25' })
  @IsOptional()
  @IsDateString()
  transferDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateWarehouseTransferDto {
  @ApiProperty()
  @IsMongoId()
  fromWarehouseId: string;

  @ApiProperty()
  @IsMongoId()
  toWarehouseId: string;

  @ApiProperty({ example: '2026-06-25' })
  @IsDateString()
  transferDate: string;

  @ApiProperty({ type: [CreateWarehouseTransferItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateWarehouseTransferItemDto)
  items: CreateWarehouseTransferItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class AcceptWarehouseTransferItemDto {
  @ApiProperty()
  @IsMongoId()
  itemId: string;

  @ApiProperty()
  @IsBoolean()
  received: boolean;

  @ApiPropertyOptional({ minimum: 0.001 })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  receivedQuantity?: number;
}

export class AcceptWarehouseTransferDto {
  @ApiProperty({ type: [AcceptWarehouseTransferItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AcceptWarehouseTransferItemDto)
  items: AcceptWarehouseTransferItemDto[];
}

export class UpdateAcceptanceProgressItemDto {
  @ApiProperty()
  @IsMongoId()
  itemId: string;

  @ApiProperty()
  @IsBoolean()
  received: boolean;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  receivedQuantity: number;
}

export class UpdateAcceptanceProgressDto {
  @ApiProperty({ type: [UpdateAcceptanceProgressItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateAcceptanceProgressItemDto)
  items: UpdateAcceptanceProgressItemDto[];
}

export class WarehouseTransferItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() productName: string;
  @ApiPropertyOptional() productBarcode?: string;
  @ApiPropertyOptional({ type: [String] }) productBarcodes?: string[];
  @ApiProperty() quantity: number;
  @ApiProperty() unitPrice: number;
  @ApiPropertyOptional() receivedQuantity?: number;
  @ApiPropertyOptional() receivedMarked?: boolean;
}

export class WarehouseTransferResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty() fromWarehouseId: string;
  @ApiProperty() fromWarehouseName: string;
  @ApiPropertyOptional() toWarehouseId?: string;
  @ApiPropertyOptional() toWarehouseName?: string;
  @ApiProperty() transferDate: string;
  @ApiProperty() status: string;
  @ApiProperty({ type: [WarehouseTransferItemResponseDto] })
  items: WarehouseTransferItemResponseDto[];
  @ApiProperty() notes: string;
  @ApiPropertyOptional() sentAt?: Date;
  @ApiPropertyOptional() completedAt?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class WarehouseTransfersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['draft', 'sent', 'completed'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['incoming', 'outgoing'] })
  @IsOptional()
  @IsString()
  direction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  fromWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  toWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transferDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  itemsCount?: number;
}
