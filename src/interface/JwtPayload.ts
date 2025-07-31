import { RoleEnum } from 'src/common/enum/RoleEnum';

export interface JwtPayload {
  userId: string;
  email: string;
  phoneNumber: string;
  role: RoleEnum;
}
