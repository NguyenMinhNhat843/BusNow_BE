import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { updateProfileDTO } from './dto/updateProfileDTO';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/s3/s3.service';
import { SearchUserDTO } from './dto/searchUserDTO';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('/create-guest')
  async createGuest(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
    },
  ) {
    return await this.userService.createGuest(
      body.firstName,
      body.lastName,
      body.email,
      body.phoneNumber,
    );
  }

  @UseGuards(new RolesGuard(['admin']))
  @Get('getUserLimit')
  async getUserLimit(@Body('start') start: number, @Body('end') end: number) {
    return await this.userService.getUserLimit(start, end);
  }

  @UseGuards(new RolesGuard(['admin']))
  @Get('getUserByEmail/email/:email')
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.findUserByEmail(email);
  }

  @UseGuards(new RolesGuard(['admin']))
  @Post('deactiveUser')
  async deactiveUser(@Body() body: { email: string; status: boolean }) {
    return await this.userService.toggleUserActiveStatus(
      body.email,
      body.status,
    );
  }

  @Get('getProfileMe')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    const user = await this.userService.findUserByEmail(
      req.user.email as string,
    );
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }
    return user;
  }

  @Get()
  async searchUser(@Query() query: SearchUserDTO) {
    return await this.userService.searchUser(query);
  }

  @Put('updateProfile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @Body() body: updateProfileDTO,
    @Req() req: any,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    // Kiểm tra user tồn tại
    const email = req.user.email as string;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    // Kiểm tra phone này đưuọc sử dụng chưa
    if (body.phoneNumber && body.phoneNumber !== user.phoneNumber) {
      const isPhoneUsed = await this.userService.findUserByPhoneNumber(
        body.phoneNumber,
      );
      if (isPhoneUsed) {
        throw new BadRequestException(
          'Số điện thoại này đã được sử dụng bởi người dùng khác',
        );
      }
    }

    // Nếu có avatar, xử lý lưu trữ hoặc cập nhật avatar
    let avatarUrl: string | undefined;
    if (avatar) {
      avatarUrl = await this.s3Service.uploadFile(avatar, 'user');
    }

    return await this.userService.updateProfile(body, email, avatarUrl);
  }
}
