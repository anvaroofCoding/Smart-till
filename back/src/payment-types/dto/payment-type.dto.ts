import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const MAX_LOGO_LENGTH = 3_000_000;

export class InstallmentPlanDto {
  @ApiProperty({ example: 3, description: 'Bo\'lib to\'lash oylari' })
  @IsInt()
  @Min(1)
  @Max(120)
  months: number;

  @ApiProperty({ example: 5.5, description: 'Foiz stavkasi (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestPercent: number;
}

export class CreatePaymentTypeDto {
  @ApiProperty({ example: 'Naqd pul' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ description: 'Base64 data URL' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LOGO_LENGTH)
  logo?: string;

  @ApiPropertyOptional({
    type: [InstallmentPlanDto],
    description: 'Ixtiyoriy. Bo\'sh qoldirilsa oy belgilanmaydi.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallmentPlanDto)
  installmentPlans?: InstallmentPlanDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePaymentTypeDto extends PartialType(CreatePaymentTypeDto) {}

export class SetPaymentTypeStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}

export class InstallmentPlanResponseDto {
  @ApiProperty()
  months: number;

  @ApiProperty()
  interestPercent: number;
}

export class PaymentTypeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  logo: string;

  @ApiProperty({ type: [InstallmentPlanResponseDto] })
  installmentPlans: InstallmentPlanResponseDto[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
