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
import { StopPointService } from 'src/stopPoint/stopPoint.service';
import { StopPointEnum } from 'src/enum/StopPointsEnum';
import { StopPoint } from 'src/stopPoint/stopPoint.entity';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private routeRepo: Repository<Route>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Location)
    private locationRepo: Repository<Location>,

    @InjectRepository(StopPoint)
    private stopPointRepo: Repository<StopPoint>,
  ) {}

  async createRoute(dto: CreateRouteDTO) {
    const {
      originId,
      destinationId,
      duration,
      restAtDestination,
      providerId,
      stopPointIds = [],
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

    // Kiểm tra phải cso tối thiểu 1 điểm đón, 1 điểm trả
    if (stopPointIds.length <= 1) {
      throw new NotFoundException('Bạn chưa đặt điểm dừng cho route');
    }

    //  Kiểm tra provider + city có tồn tại không
    const [provider, origin, destination] = await Promise.all([
      this.userRepo.findOneBy({ userId: providerId }),
      this.locationRepo.findOneBy({ locationId: originId }),
      this.locationRepo.findOneBy({ locationId: destinationId }),
    ]);
    if (!provider) throw new NotFoundException('Provider không tồn tại');
    if (!origin) throw new NotFoundException('Điểm đi không tồn tại');
    if (!destination) throw new NotFoundException('Điểm đến không tồn tại');

    // Kiểm tra 2 điểm stopPoint phải cso 1 cái ở origin city, 1 cái ở destination city
    const stopPoints1 = await this.stopPointRepo.findOne({
      where: {
        id: stopPointIds[0],
      },
      relations: ['city'],
    });
    const stopPoints2 = await this.stopPointRepo.findOne({
      where: { id: stopPointIds[1] },
      relations: ['city'],
    });
    if (!stopPoints1 || !stopPoints2) {
      throw new NotFoundException(
        'Điểm dwungf không tồn tại trong hệ thống, hãy thêm mới trước',
      );
    }
    console.log(stopPoints1);
    console.log(stopPoints2);
    const isTrue =
      (stopPoints1?.cityId === originId &&
        stopPoints2?.cityId === destinationId) ||
      (stopPoints1?.cityId === destinationId &&
        stopPoints2?.cityId === originId);
    if (!isTrue) {
      throw new BadRequestException(
        'StopPoint phải có 1 cái ở origin 1 cái ở détination',
      );
    }

    //  Tạo route mới
    const newRoute = this.routeRepo.create({
      origin,
      destination,
      duration,
      restAtDestination,
      repeatsDay: Math.ceil((duration * 2 + restAtDestination) / 8),
      provider,
    });
    await this.routeRepo.save(newRoute);

    return newRoute;
  }

  async updateRoute() {}

  // Get route - pagination
  async getRoutes(page = 1, limit = 10, providerId?: string) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.routeRepo
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.origin', 'origin')
      .leftJoinAndSelect('route.destination', 'destination')
      .leftJoinAndSelect('route.provider', 'provider')
      .leftJoinAndSelect('route.stopPoints', 'stopPoint')
      .leftJoinAndSelect('stopPoint.city', 'city')
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
