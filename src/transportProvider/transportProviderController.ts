import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TransportProviderService } from './transportProviderService';
import { CreateProviderDTO } from './dto/createProviderDTO';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/user/guards/roles.guard';

@Controller('provider')
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

  @Get('get-vehicle-me')
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin', 'PROVIDER']))
  async getVehicleByMe(@Req() req: any) {
    // console.log('req: ', req);
    const user = req.user;
    console.log('user: ', user);
    const result = await this.transportProviderService.getVehicleByProvicerId(
      user.userId,
    );
    return {
      status: 'success',
      data: result,
    };
  }
}
