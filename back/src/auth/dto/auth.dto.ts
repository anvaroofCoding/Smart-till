import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../common/constants/roles';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(2)
  login: string;

  @ApiProperty({ example: '123123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SCANNER })
  @IsEnum(UserRole)
  role: UserRole;
}
