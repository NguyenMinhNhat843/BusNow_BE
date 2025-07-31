import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const request = req as Request & {
            cookies?: Record<string, unknown>;
          };
          const token = request.cookies?.['accessToken'];
          return typeof token === 'string' ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET_KEY !== undefined
          ? process.env.JWT_SECRET_KEY
          : 'abc123',
    });
  }

  validate(payload: any) {
    // payload sẽ chứa thông tin người dùng đã được mã hóa trong JWT
    return {
      userId: payload.id,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      role: payload.role,
    };
  }
}
