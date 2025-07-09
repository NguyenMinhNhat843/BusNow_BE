import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Route } from './route.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { CreateRouteDTO } from './dto/createRouteDTO';
import { Location } from 'src/location/location.entity';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private routeRepo: Repository<Route>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Location)
    private locationRepo: Repository<Location>,
  ) {}

  async createRoute(dto: CreateRouteDTO) {
    const {
      originId,
      destinationId,
      duration,
      restAtDestination,
      repeatsDay,
      providerId,
    } = dto;

    // 0. Kiểm tra trùng route
    const existingRoute = await this.routeRepo.findOne({
      where: {
        origin: { locationId: originId },
        destination: { locationId: destinationId },
        provider: { userId: providerId },
      },
      relations: ['origin', 'destination', 'provider'],
    });

    if (existingRoute) {
      throw new BadRequestException('Route này đã tồn tại cho nhà xe của bạn');
    }

    // 1. Kiểm tra provider
    const provider = await this.userRepo.findOneBy({ userId: providerId });
    if (!provider) {
      throw new NotFoundException('Provider không tồn tại');
    }

    // 2. Kiểm tra location
    const origin = await this.locationRepo.findOneBy({ locationId: originId });
    if (!origin) {
      throw new NotFoundException('Điểm đi không tồn tại');
    }

    const destination = await this.locationRepo.findOneBy({
      locationId: destinationId,
    });
    if (!destination) {
      throw new NotFoundException('Điểm đến không tồn tại');
    }

    // 3. Tạo route mới
    const newRoute = this.routeRepo.create({
      origin,
      destination,
      duration,
      restAtDestination,
      repeatsDay,
      provider,
    });

    await this.routeRepo.save(newRoute);
    return newRoute;
  }

  async getRoutes(page = 1, limit = 10, providerId?: string) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.routeRepo
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.origin', 'origin')
      .leftJoinAndSelect('route.destination', 'destination')
      .leftJoinAndSelect('route.provider', 'provider')
      .skip(skip)
      .take(limit)
      .orderBy('route.createdAt', 'DESC');

    if (providerId) {
      queryBuilder.where('provider.userId = :providerId', { providerId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
    };
  }
}
