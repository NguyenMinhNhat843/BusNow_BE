import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Like, Repository } from 'typeorm';
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
    private dataSource: DataSource,
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

  async findStopPointsByRoute(routeId: string) {
    const route = await this.dataSource
      .getRepository(Route)
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.stopPoints', 'stopPoint')
      .leftJoinAndSelect('stopPoint.city', 'city')
      .where('route.routeId = :routeId', { routeId })
      .getOne();

    if (!route) {
      throw new NotFoundException('Không tìm thấy tuyến xe!');
    }

    return route.stopPoints.map((sp) => ({
      id: sp.id,
      name: sp.name,
      address: sp.address,
      city: {
        id: sp.city?.locationId,
        name: sp.city?.name,
      },
    }));
  }

  // Lấy stopPoint theo Route, lấy hết - có phân trang, lấy stopPoint theo city
  // Lấy theo type: Pickup or dropoff
  // sort theo createdAt
  async searchStopPoint(options: SearchStopPointDto) {
    const { cityId, page = 1, limit = 10 } = options;

    let where: any = {};
    if (cityId) where = { cityId };

    const [data, total] = await this.stopPointRepo.findAndCount({
      where: { cityId },
      relations: ['city'],
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
