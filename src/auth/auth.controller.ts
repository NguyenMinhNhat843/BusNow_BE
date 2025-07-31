import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RegisterDTO } from './dto/RegisterDTO';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/LoginDTO';
import { AuthGuard } from '@nestjs/passport';
import { changePasswordDTO } from './dto/changePasswordDTO';
import { Response } from 'express';
import { RegisterProviderDTO } from './dto/RegisterProviderDTO';
import { RoleEnum } from 'src/common/enum/RoleEnum';
import { JwtPayload } from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp-register')
  async sendOtpRegister(@Body() body: { email: string }) {
    // check email đã được đăng ký hay chưa
    const isExistsUser = await this.authService.findUserByEmail(body.email);
    if (isExistsUser) {
      // Kiểm tra phải guest ko
      const isGuest = isExistsUser.role === RoleEnum.GUEST;
      if (!isGuest) {
        throw new BadRequestException('Email đã được đăng ký!!!');
      }
    }

    const otp = this.authService.generrateOtp();
    this.authService.saveOtp(body.email, otp);
    await this.authService.sendOtp(body.email, otp);
    return {
      message:
        'Vui lòng kiểm tra email và xác thực otp để hoàn thành đăng ký!!!',
    };
  }

  @Post('register')
  async register(@Body() body: RegisterDTO) {
    return this.authService.register(body);
  }

  @Post('register-provider')
  async registerProvider(@Body() body: RegisterProviderDTO) {
    const response = await this.authService.registerProvider(body);

    return {
      status: 'success',
      data: response,
    };
  }

  @Get('login')
  async login(
    @Query() param: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = await this.authService.login(param);

    // Lưu token vào httpOnly cookie
    res.cookie('accessToken', loginResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Chỉ sử dụng secure cookie trong môi trường production
      sameSite: 'strict', // Cài đặt SameSite để bảo vệ chống CSRF
      maxAge: 24 * 60 * 60 * 1000, // Cookie
    });

    return {
      status: 200,
      message: 'Đăng nhập thành công',
      user: loginResult.existsUser,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    return {
      status: 200,
      message: 'Đăng xuất thành công',
    };
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { email: string }) {
    const otp = this.authService.generrateOtp();
    this.authService.saveOtp(body.email, otp);
    await this.authService.sendOtp(body.email, otp);
    return { message: 'OTP đã được gửi đến email của bạn.' };
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { email: string; otp: string }) {
    const { email, otp } = body;
    const isValid = this.authService.verifyOtp(email, otp);
    if (!isValid) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn!');
    }
    return { message: 'Xác thực OTP thành công!' };
  }

  @Post('send-reset-password-link')
  async sendReserPasswordLink(@Body() body: { email: string }) {
    if (!body.email || body.email.trim() === '') {
      throw new BadRequestException('Email không được để trống!');
    }
    const { email } = body;

    await this.authService.sendResetPasswordLink(email);
    return {
      message:
        'Đường dẫn đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra email để tiếp tục.',
    };
  }

  // AuthController
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('changePassword')
  @UseGuards(AuthGuard('jwt')) // Sử dụng guard JWT để bảo vệ route này
  async changePassword(@Body() body: changePasswordDTO, @Req() req: any) {
    const email = req.user.email;
    return this.authService.changePassword(
      email as string,
      body.oldPassword,
      body.newPassword,
    );
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthCallback(@Req() req: Request & JwtPayload, @Res() res: Response) {
    const user = req.user;
    const token = this.authService.generateTokenJwt({
      email: user.email,
      role: user.role,
      userId: user.userId,
    });

    // Lưu token vô httponly cookie
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // hoặc 'strict' nếu cần chặt chẽ hơn
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    const redirectUrl = `${process.env.URL_FE}/login-success`;
    return res.redirect(redirectUrl);
  }
}
