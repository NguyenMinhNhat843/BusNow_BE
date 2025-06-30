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

  async getAllLocation() {
    return this.locationRepository.find();
  }

  async getLocationDetail(locationKeyword: string) {
    // Xuwr lý chuỗi: bỏ khoảng trắng, chuyển chữ thường
    locationKeyword = locationKeyword.trim().toLowerCase();

    // Tìm kiếm location theo ID hoặc tên
    const location = await this.locationRepository.findOne({
      where: isUUID(locationKeyword)
        ? { locationId: locationKeyword }
        : { name: ILike(locationKeyword) },
      relations: ['locationDetails'],
    });
    return location;
  }

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
