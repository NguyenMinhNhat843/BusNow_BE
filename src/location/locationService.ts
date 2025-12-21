import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { Location } from './location.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { validate as isUUID } from 'uuid';
import { StopPoint } from '@/stopPoint/stopPoint.entity';
import { createLocationDto } from './dto/createLcationDto';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { deleteLocationDto } from './dto/deleteLocationDto';
import { UpdateLocationDto } from './dto/updateLocationDto';

@Injectable()
export class LocationService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Location)
    private readonly locationRep: Repository<Location>,

    @InjectRepository(StopPoint)
    private readonly stopPointRep: Repository<StopPoint>,
  ) {}

  async isLocationExists(locationId: string) {
    return await this.locationRep.existsBy({ locationId });
  }

  async getAllLocation() {
    const result = this.locationRep.find({
      relations: {
        stopPoints: true,
      },
    });
    return result;
  }

  async getLocationDetail(locationKeyword: string) {
    // Xuwr lý chuỗi: bỏ khoảng trắng, chuyển chữ thường
    locationKeyword = locationKeyword.trim().toLowerCase();

    // Tìm kiếm location theo ID hoặc tên
    const location = await this.locationRep.findOne({
      where: isUUID(locationKeyword)
        ? { locationId: locationKeyword }
        : { name: ILike(locationKeyword) },
      relations: ['locationDetails'],
    });
    return location;
  }

  async createLocation(payload: createLocationDto) {
    const { locationName, stopPoints } = payload;

    const cityExists = await this.locationRep.findOne({
      where: {
        name: locationName,
      },
    });

    if (cityExists) {
      throw new ConflictException('Tên địa điểm đã tồn tại!');
    }

    return this.dataSource.transaction(async (manager) => {
      const newLocation = manager.create(Location, {
        name: locationName,
      });
      await manager.save(newLocation);

      const stopPointEntities = stopPoints.map((sp) => {
        return manager.create(StopPoint, {
          name: sp.name,
          address: sp.address,
          cityId: newLocation.locationId,
        });
      });
      await manager.save(stopPointEntities);

      newLocation.stopPoints = stopPointEntities;

      return newLocation;
    });
  }

  async deleteLocation(payload: deleteLocationDto) {
    const { locationId } = payload;

    const isExists = await this.isLocationExists(locationId);
    if (!isExists) {
      throw new ConflictException('Location không tồn tại!');
    }

    await this.locationRep.delete({ locationId });

    return {
      message: 'Xoá location thành công',
    };
  }

  async findLocationByNameOrId(keyword: string) {
    // Xử lý chuỗi: bỏ khoảng trắng, chuyển chữ thường
    keyword = keyword.trim().toLowerCase();

    // Tìm kiếm location theo ID hoặc tên
    const location = await this.locationRep.findOne({
      where: isUUID(keyword)
        ? { locationId: keyword }
        : { name: ILike(keyword) },
    });

    return location;
  }

  // async updateLocation(payload: UpdateLocationDto) {
  //   const {locationId, locationName, stopPoints} = payload

  //   const exists = await this.isLocationExists(locationId)
  //   if(!exists) {
  //     throw new ConflictException('Địa điểm không tồn tại!')
  //   }

  //   await this.dataSource.transaction(async (manager) => {
  //     await manager.update(Location,
  //       {locationId},
  //       {name: locationName}
  //     )

  //   })
  // }
}
