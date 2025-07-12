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
import { Route } from 'src/route/route.entity';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Route)
    private routeRepo: Repository<Route>,
  ) {}

  findVehicleByIdOrCodeNumber(keyword: string) {
    const vehicle = this.vehicleRepository.findOne({
      where: isUUID(keyword) ? { vehicleId: keyword } : { code: keyword },
    });
    return vehicle;
  }

  async createVehicle(data: CreateVehicleDTO) {
    const { code, totalSeat, busType, providerId, routeId, departHour } = data;
    // Kiểm tra code - biển số xe đã tồn tại chưa
    const vehicleExists = await this.vehicleRepository.findOne({
      where: {
        code: code,
      },
    });
    if (vehicleExists) {
      throw new BadRequestException(
        `Biển số xe ${vehicleExists.code} đã tồn tại rồi`,
      );
    }

    // Kiểm tra routerId
    const route = await this.routeRepo.findOne({
      where: {
        routeId: routeId,
      },
    });
    if (!route) {
      throw new NotFoundException('Tuyến đường này không tồn tại!!!');
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

    // Tính repeatsDay
    // const repeatsDay = Math.ceil(
    //   (route.duration * 2 + route.restAtDestination) / 8,
    // );

    // Taoj vehicle
    const vehicle = this.vehicleRepository.create({
      code,
      totalSeat,
      busType,
      provider,
      route,
      departHour,
      isActive: true,
    });

    await this.vehicleRepository.save(vehicle);
    return vehicle;
  }

  async getVehicles(
    page = 1,
    limit = 10,
    providerId?: string,
    vehicleId?: string,
  ) {
    if (vehicleId) {
      const response = await this.vehicleRepository.findOne({
        where: {
          vehicleId: vehicleId,
        },
        relations: ['route', 'route.origin', 'route.destination'],
      });

      return {
        status: 'success',
        data: response,
      };
    }

    const skip = (page - 1) * limit;

    const query = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.route', 'route')
      .leftJoinAndSelect('route.origin', 'origin')
      .leftJoinAndSelect('route.destination', 'destination')
      .leftJoinAndSelect('vehicle.provider', 'provider')
      .select([
        'vehicle.vehicleId',
        'vehicle.code',
        'vehicle.totalSeat',
        'vehicle.isActive',
        'vehicle.busType',
        'route.routeId',
        'route.duration',
        'route.restAtDestination',
        'route.repeatsDay',
        'vehicle.departHour',
        'origin.name',
        'destination.name',
      ])
      .skip(skip)
      .limit(limit)
      .orderBy('vehicle.createdAt', 'DESC');

    if (providerId) {
      query.andWhere('provider.userId = :userId', { userId: providerId });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      pagination: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data,
    };
  }
}
