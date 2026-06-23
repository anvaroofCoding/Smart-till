import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UserPosition } from '../../common/constants/positions';

export class CreateUserDto {
  @ApiProperty({ example: 'Islom' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Karimov' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({ example: 'islom.k' })
  @IsString()
  @MinLength(2)
  login: string;

  @ApiProperty({ example: 'secure123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+998 90 123 45 67' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ example: '1995-06-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ enum: UserPosition, example: UserPosition.KASSIR })
  @IsEnum(UserPosition)
  position: UserPosition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'islom@warehouse.uz' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: ['/kassir/buyurtmalar', '/maxsulotlar/ro-yxat'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedPages?: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UsersStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  inactive: number;

  @ApiProperty({ description: 'O\'rtacha profilga kirishlik darajasi (%)' })
  profileAccessLevel: number;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  login: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  age: number;

  @ApiPropertyOptional()
  birthDate?: string;

  @ApiProperty({ enum: UserPosition })
  position: UserPosition;

  @ApiProperty({ type: [String] })
  allowedPages: string[];

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
