import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
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
import { PAYMENT_CHANNELS } from '../../daily-balances/constants/payment-channel';

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

  @ApiPropertyOptional({ enum: PAYMENT_CHANNELS, default: 'other' })
  @IsOptional()
  @IsEnum(PAYMENT_CHANNELS)
  channel?: (typeof PAYMENT_CHANNELS)[number];

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

  @ApiProperty({ enum: PAYMENT_CHANNELS })
  channel: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({
    enum: ['cash', 'terminal', 'card'],
    description: 'Tizim to\'lov turi kaliti (Naqd, Terminal, Karta)',
  })
  systemKey?: string;

  @ApiProperty({
    description: 'Tizim to\'lov turi — o\'chirib yoki nomini o\'zgartirib bo\'lmaydi',
  })
  isSystem: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
