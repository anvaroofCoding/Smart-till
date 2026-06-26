import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const MAX_IMAGE_LENGTH = 3_000_000;

export class CreateProductDto {
  @ApiProperty({ example: 'Samsung Galaxy A55' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: '256GB, ko\'k rang' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: '665f1c2b9a3f4e5d6a7b8c9d' })
  @IsMongoId()
  categoryId: string;

  @ApiProperty({ example: '665f1c2b9a3f4e5d6a7b8c9e' })
  @IsMongoId()
  brandId: string;

  @ApiPropertyOptional({ description: 'Base64 data URL' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_IMAGE_LENGTH)
  image?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ example: '256GB, ko\'k rang' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class SetProductStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}

export class ProductRelationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 'MXS-000001' })
  code: string;

  @ApiProperty({ example: '2000000000012' })
  barcode: string;

  @ApiProperty({ type: [String], example: ['2000000000012', '8690000000012'] })
  barcodes: string[];

  @ApiProperty()
  description: string;

  @ApiProperty({ type: ProductRelationDto })
  category: ProductRelationDto;

  @ApiProperty({ type: ProductRelationDto })
  brand: ProductRelationDto;

  @ApiProperty()
  image: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
