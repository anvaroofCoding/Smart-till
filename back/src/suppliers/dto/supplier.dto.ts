import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  DEFAULT_SUPPLIER_CURRENCY,
  SUPPLIER_CURRENCIES,
} from '../../common/constants/currency';

type SupplierCurrency = (typeof SUPPLIER_CURRENCIES)[number];

export class CreateSupplierDto {
  @ApiProperty({ example: 'Tech Supply LLC' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Tech Supply MCHJ' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  officialName?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'Toshkent, Chilonzor tumani' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'Asosiy yetkazib beruvchi' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({
    enum: SUPPLIER_CURRENCIES,
    default: DEFAULT_SUPPLIER_CURRENCY,
  })
  @IsOptional()
  @IsIn(SUPPLIER_CURRENCIES)
  currency?: SupplierCurrency;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}

export class SetSupplierStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}

export class SupplierResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  officialName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  comment: string;

  @ApiProperty({ enum: SUPPLIER_CURRENCIES })
  currency: SupplierCurrency;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
