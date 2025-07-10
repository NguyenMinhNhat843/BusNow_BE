import { BadRequestException, Injectable } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { StopPoint } from './stopPoint.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLocationDetailDTO } from './dto/createStopPoint';
import { LocationService } from 'src/location/locationService';
import { validate as isUUID } from 'uuid';

@Injectable()
export class StopPointService {
  constructor(
    @InjectRepository(StopPoint)
    private readonly stopPointRepo: Repository<StopPoint>,

    private readonly locationService: LocationService,
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

  async createLocationDetail(locationDetailData: CreateLocationDetailDTO) {
    // const { name, locationId } = locationDetailData;
    // const location =
    //   await this.locationService.findLocationByNameOrId(locationId);
    // if (!location) {
    //   throw new BadRequestException('location không tồn tại!!!');
    // }
    // const newLocationDetail = this.stopPointRepo.create({
    //   name,
    //   location,
    // });
    // await this.stopPointRepo.save(newLocationDetail);
    // return newLocationDetail;
  }
}
