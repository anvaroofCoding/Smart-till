import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Elektronika' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'Elektron mahsulotlar guruhi' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductCategoryDto extends PartialType(
  CreateProductCategoryDto,
) {}

export class SetProductCategoryStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}

export class ProductCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ description: 'Ushbu kategoriyadan foydalanilgan maxsulotlar soni' })
  productsCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
