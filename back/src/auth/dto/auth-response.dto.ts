import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/constants/roles';
import { UserPosition } from '../../common/constants/positions';

export class AuthTokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  tokenType: string;

  @ApiProperty()
  expiresIn: string;
}

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  login: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: UserPosition })
  position: UserPosition;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  birthDate?: string;

  @ApiProperty({ type: [String] })
  allowedPages: string[];

  @ApiProperty()
  allWarehouses: boolean;

  @ApiProperty({ type: [String] })
  warehouseIds: string[];

  @ApiProperty({ type: [Object] })
  warehouses: Array<{ id: string; name: string }>;
}

export class LoginResponseDto {
  @ApiProperty({ type: AuthTokensDto })
  tokens: AuthTokensDto;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
