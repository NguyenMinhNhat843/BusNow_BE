import { Injectable } from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { TransportProvider } from './transportProvider.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProviderDTO } from './dto/createProviderDTO';

@Injectable()
export class TransportProviderService {
  constructor(
    @InjectRepository(TransportProvider)
    private readonly transportRepository: Repository<TransportProvider>,
  ) {}

  create(transportProvider: CreateProviderDTO): Promise<TransportProvider> {
    return this.transportRepository.save(transportProvider);
  }

  async getVehicleByProviderId(id: string) {
    const result = await this.transportRepository.find({
      where: {
        providerId: id,
      },
    });
    return result;
  }
}
