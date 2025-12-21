import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { UserService } from 'src/user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly userService: UserService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'default-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'default-client-secret',
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  authorizationParams(): { [key: string]: string } {
    return {
      prompt: 'select_account',
    };
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    const { name, emails, photos } = profile;
    const userData = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      avatar: photos[0].value,
      accessToken,
    };

    const user = await this.userService.findOrcreateUserByGoogle(userData);

    // Gắn user có token vào request để sử dụng trong các route khác
    done(null, user);
  }
}
