import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ORDER_STATUSES } from '../schemas/order.schema';

export class OrderQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Buyurtma ID (qisman qidiruv)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Mijoz ismi' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Mijoz telefon raqami' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Buyurtma narxi (subtotal)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Umumiy narx' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  total?: number;

  @ApiPropertyOptional({ description: 'Chegirma summasi' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountTotal?: number;

  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Kassir ismi' })
  @IsOptional()
  @IsString()
  createdByName?: string;

  @ApiPropertyOptional({
    description: 'Saqlangan sana (yyyy-MM-dd yoki dd.MM.yyyy)',
  })
  @IsOptional()
  @IsString()
  createdAt?: string;
}
