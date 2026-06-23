import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProductBrandDto {
  @ApiProperty({ example: 'Samsung' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'Koreya elektronika brendi' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductBrandDto extends PartialType(CreateProductBrandDto) {}

export class SetProductBrandStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}

export class ProductBrandResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ description: 'Ushbu brenddan foydalanilgan maxsulotlar soni' })
  productsCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
