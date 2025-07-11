import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { StopPoint } from './stopPoint.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateStopPointDto } from './dto/createStopPointDTO';
import { LocationService } from 'src/location/locationService';
import { validate as isUUID } from 'uuid';
import { SearchStopPointDto } from './dto/SearchStopPoint';
import { Route } from 'src/route/route.entity';
import { Location } from 'src/location/location.entity';

@Injectable()
export class StopPointService {
  constructor(
    @InjectRepository(StopPoint)
    private readonly stopPointRepo: Repository<StopPoint>,

    // @InjectRepository(Route)
    // private routeRepo: Repository<Route>,

    @InjectRepository(Location)
    private cityRepo: Repository<Location>,
  ) {}

  async findLocationDetailByIdOrName(id?: string, name?: string) {
    if (id) {
      return this.stopPointRepo.find({
        where: { id: id },
        relations: ['route', 'city'],
      });
    }

    if (name) {
      return this.stopPointRepo.find({
        where: { name: Like(`%${name}%`) },
        relations: ['route', 'city'],
        take: 10,
      });
    }

    throw new BadRequestException('Phải cung cấp id hoặc name để tìm kiếm');
  }

  // Lấy stopPoint theo Route, lấy hết - có phân trang, lấy stopPoint theo city
  // Lấy theo type: Pickup or dropoff
  // sort theo createdAt
  async searchStopPoint(options: SearchStopPointDto) {
    const { routeId, cityId, type, page = 1, limit = 10 } = options;

    const where: any = {};
    if (routeId) where.route = { routeId };
    if (cityId) where.city = { id: cityId };
    if (type) where.type = type;

    const [data, total] = await this.stopPointRepo.findAndCount({
      where,
      relations: ['route', 'city'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      status: 'success',
      pagination: {
        total,
        page,
        limit,
        totalPage: Math.ceil(total / limit),
      },
      data,
    };
  }

  async createStopPoint(dto: CreateStopPointDto) {
    const { name, address, cityId } = dto;
    const city = await this.cityRepo.findOneBy({ locationId: cityId });
    if (!city) throw new NotFoundException('Không tìm thấy thành phố');
    const stopPoint = this.stopPointRepo.create({
      name,
      address,
      city,
    });
    await this.stopPointRepo.save(stopPoint);
    return {
      status: 'success',
      data: stopPoint,
    };
  }
}
