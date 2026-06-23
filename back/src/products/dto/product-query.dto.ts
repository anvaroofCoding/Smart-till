import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Maxsulot ID (qisman qidiruv)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Maxsulot kodi' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Maxsulot nomi' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Izoh' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Saqlangan sana (yyyy-MM-dd yoki dd.MM.yyyy)',
  })
  @IsOptional()
  @IsString()
  createdAt?: string;
}
