import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
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
  PriceSettingMode,
  PriceSettingType,
} from '../constants/price-setting-type';

export class PriceSettingQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ enum: PriceSettingType })
  @IsOptional()
  @IsEnum(PriceSettingType)
  settingType?: PriceSettingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Faqat barcha filiallarga qo\'llangan sozlamalar' })
  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  allWarehouses?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiPropertyOptional({ enum: PriceSettingMode })
  @IsOptional()
  @IsEnum(PriceSettingMode)
  mode?: PriceSettingMode;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  percentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'dd.MM.yyyy formatida' })
  @IsOptional()
  @IsString()
  createdAt?: string;
}
