import { UserRole } from '../../common/constants/roles';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
