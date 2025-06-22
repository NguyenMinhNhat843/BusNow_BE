import { Controller, Get, Post } from '@nestjs/common';
import { TransportProviderService } from './transportProviderService';
import { CreateProviderDTO } from './dto/createProviderDTO';

@Controller('transport-provider')
export class TransportProviderController {
  constructor(
    private readonly transportProviderService: TransportProviderService,
  ) {}

  @Post()
  createProvider(transportProvider: CreateProviderDTO) {
    return this.transportProviderService.create(transportProvider);
  }

  @Get()
  async findAll() {
    return this.transportProviderService.getAll();
  }
}
