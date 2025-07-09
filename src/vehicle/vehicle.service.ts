import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { validate as isUUID } from 'uuid';
import { CreateVehicleDTO } from './dto/createVehicleDTO';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';
import { RoleEnum } from 'src/common/enum/RoleEnum';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findVehicleByIdOrCodeNumber(keyword: string) {
    const vehicle = this.vehicleRepository.findOne({
      where: isUUID(keyword) ? { vehicleId: keyword } : { code: keyword },
    });
    return vehicle;
  }

  async createVehicle(data: CreateVehicleDTO) {
    // Kiểm tra code - biển số xe đã tồn tại chưa
    const vehicle = await this.vehicleRepository.findOne({
      where: {
        code: data.code,
      },
    });
    if (vehicle) {
      throw new BadRequestException(
        `Biển số xe ${vehicle.code} đã tồn tại rồi`,
      );
    }

    // Kiểm tra providerId có tồn tại không
    if (!data?.providerId) {
      throw new NotFoundException('Thiếu providerId rồi');
    }

    // Kiểm tra provider có tồn tại không
    const provider = await this.userRepository.findOne({
      where: { userId: data.providerId },
    });
    if (!provider) {
      throw new NotFoundException('nhà cung cấp này không tồn tại');
    }

    // Kiểm tra vai trò
    if (provider.role !== RoleEnum.PROVIDER) {
      throw new BadRequestException('Người dùng này không phải nhà cung cấp');
    }

    // Tạo
    const result = this.vehicleRepository.create({
      ...data,
      provider,
    });
    await this.vehicleRepository.save(result);
    return result;
  }
}
