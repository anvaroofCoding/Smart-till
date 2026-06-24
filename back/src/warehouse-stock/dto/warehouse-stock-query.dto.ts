import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class WarehouseStockQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Ombor ID' })
  @IsOptional()
  @IsMongoId()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Yozuv ID (qisman qidiruv)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Maxsulot ID' })
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiPropertyOptional({ description: 'Kategoriya ID' })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Brend ID' })
  @IsOptional()
  @IsMongoId()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Maxsulot nomi' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ description: 'Ombor nomi' })
  @IsOptional()
  @IsString()
  warehouseName?: string;

  @ApiPropertyOptional({ description: 'Kirim narxi' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Ombordagi soni' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Sotiladigan narx' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sellingPrice?: number;

  @ApiPropertyOptional({ description: 'Tovar qiymati' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalValue?: number;
}
