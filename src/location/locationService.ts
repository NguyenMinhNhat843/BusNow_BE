import { Injectable } from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { Location } from './location.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { validate as isUUID } from 'uuid';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async createLocation(nameLocation: string) {
    const newLocation = this.locationRepository.create({
      name: nameLocation,
    });

    await this.locationRepository.save(newLocation);
    return newLocation;
  }

  async findLocationByNameOrId(keyword: string) {
    // Xử lý chuỗi: bỏ khoảng trắng, chuyển chữ thường
    keyword = keyword.trim().toLowerCase();

    // Tìm kiếm location theo ID hoặc tên
    const location = await this.locationRepository.findOne({
      where: isUUID(keyword)
        ? { locationId: keyword }
        : { name: ILike(keyword) },
    });

    return location;
  }
}
