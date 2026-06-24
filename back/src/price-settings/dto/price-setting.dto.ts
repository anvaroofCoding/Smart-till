import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  PriceSettingMode,
  PriceSettingType,
} from '../constants/price-setting-type';

export class CreatePriceSettingDto {
  @ApiProperty({ enum: PriceSettingType })
  @IsEnum(PriceSettingType)
  settingType: PriceSettingType;

  @ApiPropertyOptional({ description: 'Filial (ombor) ID' })
  @ValidateIf((dto: CreatePriceSettingDto) => !dto.applyToAllWarehouses)
  @IsMongoId()
  warehouseId?: string;

  @ApiPropertyOptional({
    description: 'Barcha filiallarga qo\'llash',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  applyToAllWarehouses?: boolean;

  @ApiPropertyOptional({ description: 'Kategoriya ID (kategoriya va brend uchun)' })
  @ValidateIf(
    (dto: CreatePriceSettingDto) =>
      dto.settingType === PriceSettingType.CATEGORY ||
      dto.settingType === PriceSettingType.BRAND,
  )
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Brend ID (brend uchun)' })
  @ValidateIf((dto: CreatePriceSettingDto) => dto.settingType === PriceSettingType.BRAND)
  @IsMongoId()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Maxsulot ID (maxsulot uchun)' })
  @ValidateIf((dto: CreatePriceSettingDto) => dto.settingType === PriceSettingType.PRODUCT)
  @IsMongoId()
  productId?: string;

  @ApiProperty({ enum: PriceSettingMode })
  @IsEnum(PriceSettingMode)
  mode: PriceSettingMode;

  @ApiPropertyOptional({ description: 'Foyda foizi (%)' })
  @ValidateIf(
    (dto: CreatePriceSettingDto) =>
      dto.mode === PriceSettingMode.PERCENTAGE ||
      dto.settingType !== PriceSettingType.PRODUCT,
  )
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  percentage?: number;

  @ApiPropertyOptional({ description: 'Qo\'lda kiritilgan sotuv narxi' })
  @ValidateIf(
    (dto: CreatePriceSettingDto) =>
      dto.settingType === PriceSettingType.PRODUCT &&
      dto.mode === PriceSettingMode.FIXED,
  )
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fixedPrice?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePriceSettingDto extends PartialType(CreatePriceSettingDto) {}

export class SetPriceSettingStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}

export class PriceSettingRelationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class PriceSettingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PriceSettingType })
  settingType: PriceSettingType;

  @ApiProperty({ type: PriceSettingRelationDto })
  warehouse: PriceSettingRelationDto;

  @ApiPropertyOptional({ type: PriceSettingRelationDto })
  category?: PriceSettingRelationDto;

  @ApiPropertyOptional({ type: PriceSettingRelationDto })
  brand?: PriceSettingRelationDto;

  @ApiPropertyOptional({ type: PriceSettingRelationDto })
  product?: PriceSettingRelationDto;

  @ApiProperty({ enum: PriceSettingMode })
  mode: PriceSettingMode;

  @ApiPropertyOptional()
  percentage?: number;

  @ApiPropertyOptional()
  fixedPrice?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
