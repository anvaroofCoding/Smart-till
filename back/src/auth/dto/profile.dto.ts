import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Islom' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Karimov' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional({ example: 'islom.k' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  login?: string;

  @ApiPropertyOptional({ example: '+998 90 123 45 67' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1995-06-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'yangiParol123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}
