import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { parseOptionalBoolean } from '../../common/utils/list-filter.utils';

export class ProductBrandQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Brend ID (qisman qidiruv)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Brend nomi' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Izoh' })
  @IsOptional()
  @IsString()
  description?: string;

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
