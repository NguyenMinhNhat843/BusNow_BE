import { RoleEnum } from 'src/common/enum/RoleEnum';

export interface JwtPayload {
  userId: string;
  email: string;
  role: RoleEnum;
}
