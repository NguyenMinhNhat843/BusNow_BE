import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LocationDetail } from './locationDetail.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLocationDetailDTO } from './dto/createLocationDetailDTO';
import { LocationService } from 'src/location/locationService';
import { validate as isUUID } from 'uuid';

@Injectable()
export class LocationDetailService {
  constructor(
    @InjectRepository(LocationDetail)
    private readonly locationDetailRepository: Repository<LocationDetail>,

    private readonly locationService: LocationService,
  ) {}

  async findLocationDetailByIdOrName(keyword: string) {
    // Kiểm ta là id hay name
    const isId = isUUID(keyword);
    const locationDetail = await this.locationDetailRepository.findOne({
      where: isId ? { locationDetailId: keyword } : { name: keyword },
      relations: ['location'],
    });

    if (!locationDetail) {
      throw new BadRequestException('Không tìm thấy địa chỉ chi tiết này!!!');
    }

    return locationDetail;
  }

  async createLocationDetail(locationDetailData: CreateLocationDetailDTO) {
    const { name, locationId } = locationDetailData;

    const location = await this.locationService.findLocationByName(locationId);
    if (!location) {
      throw new BadRequestException('location không tồn tại!!!');
    }

    const newLocationDetail = this.locationDetailRepository.create({
      name,
      location,
    });

    await this.locationDetailRepository.save(newLocationDetail);
    return newLocationDetail;
  }
}
