import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Asosiy ombor' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'Toshkent sh., Chilonzor tumani' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Markaziy ombor, katta hajmli mahsulotlar uchun' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 50_000_000,
    description: 'Kunlik savdo rejasi (so\'m)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailySalesPlan?: number;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}

export class SetWarehouseStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}

export class WarehouseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ description: 'Kunlik savdo rejasi (so\'m)' })
  dailySalesPlan: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
