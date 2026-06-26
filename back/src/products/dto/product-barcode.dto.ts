import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProductBarcodeDto {
  @ApiProperty({ example: '8690000000012' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  value: string;
}

export class ProductBarcodeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty({ example: '2000000000012' })
  value: string;

  @ApiProperty({ enum: ['system', 'manual'] })
  source: 'system' | 'manual';

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  createdAt: Date;
}
