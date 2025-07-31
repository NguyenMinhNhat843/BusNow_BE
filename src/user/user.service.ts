import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserByGoogleDTO } from './dto/createUserByGoogleDTO';
import { updateProfileDTO } from './dto/updateProfileDTO';
import { S3Service } from 'src/s3/s3.service';
import { RoleEnum } from 'src/common/enum/RoleEnum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private s3Service: S3Service,
  ) {}

  async createGuest(
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
  ) {
    const user = this.userRepo.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      role: RoleEnum.GUEST,
    });
    return await this.userRepo.save(user);
  }

  async findOrcreateUserByGoogle(data: CreateUserByGoogleDTO) {
    let user = await this.userRepo.findOneBy({ email: data.email });
    if (!user) {
      user = this.userRepo.create({
        ...data,
        provider: 'google',
      });
      await this.userRepo.save(user);
    }

    return user;
  }

  async findUserByEmail(key: string) {
    // Kiểm tra key có phải email không (đơn giản bằng regex)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);

    const user = isEmail
      ? await this.userRepo.findOneBy({ email: key })
      : await this.userRepo.findOneBy({ userId: key });

    return user;
  }

  async findUserByPhoneNumber(phone: string) {
    const user = await this.userRepo.findOneBy({ phoneNumber: phone });
    return user;
  }

  async getUserLimit(start: number, end: number) {
    const total = await this.userRepo.count();
    if (end < start) {
      throw new BadRequestException('Điểm kết thúc phải lớn hơn điểm bắt đầu');
    }
    if (start > total) {
      throw new BadRequestException('Điểm bắt đầu vượt quá tổng số người dùng');
    }

    const take = Math.min(end - start + 1, total - start);
    const skip = start;

    const user = await this.userRepo.find({
      skip,
      take,
    });

    return {
      total,
      start,
      end: start + take - 1,
      users: user,
    };
  }

  async toggleUserActiveStatus(
    email: string,
    status: boolean,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('Nguời dùng không tồn tại');
    }

    if (user.isActive === status) {
      return { message: `tài khoản đã ${status ? 'kích hoạt' : 'vô hiệu'}` };
    }

    user.isActive = status;
    await this.userRepo.save(user);

    return {
      message: `Tài khoản ${status ? 'kích hoạt lại' : 'vô hiệu'} thành công`,
    };
  }

  async updateProfile(
    body: updateProfileDTO,
    email: string,
    avatarUrl?: string,
  ) {
    const user = await this.userRepo.findOneBy({ email: email });
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    // Nếu có ảnh mới và user đã có avatar cũ → xóa file cũ trên S3
    if (avatarUrl && user.avatar) {
      // Cắt key từ URL cũ, ví dụ:
      // https://busnow8843.s3.ap-southeast-1.amazonaws.com/user/avatars/abc123.jpg
      const oldKey = user.avatar.split('.amazonaws.com/')[1]; // → user/avatars/abc123.jpg
      if (oldKey) {
        await this.s3Service.deleteFile(oldKey);
      }

      user.avatar = avatarUrl;
    }

    // Cập nhật các trường trong user
    user.firstName = body.firstName || user.firstName;
    user.lastName = body.lastName || user.lastName;
    user.phoneNumber = body.phoneNumber || user.phoneNumber;
    user.address = body.address || user.address;
    user.birthDate = body.birthDate || user.birthDate;
    // Nếu user chưa có avatar thêm path vào
    user.avatar = avatarUrl || user.avatar;

    await this.userRepo.save(user);
    return {
      status: 'success',
      message: 'Cập nhật thông tin người dùng thành công',
    };
  }
}
