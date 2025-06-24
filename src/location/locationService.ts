import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { InjectRepository } from '@nestjs/typeorm';

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

  async findLocationByName(id: string) {
    const location = await this.locationRepository.findOneBy({
      locationId: id,
    });

    return location;
  }
}
