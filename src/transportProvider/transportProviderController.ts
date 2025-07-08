import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TransportProviderService } from './transportProviderService';
import { CreateProviderDTO } from './dto/createProviderDTO';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/user/guards/roles.guard';
import { Request } from '@nestjs/common';

interface JwtUserPayload {
  userId: string;
  email: string;
  role: string;
}

@Controller('provider')
@UseGuards(JwtAuthGuard, new RolesGuard(['admin', 'PROVIDER']))
export class TransportProviderController {
  constructor(
    private readonly transportProviderService: TransportProviderService,
  ) {}

  @Post()
  createProvider(transportProvider: CreateProviderDTO) {
    return this.transportProviderService.create(transportProvider);
  }

  @Get('get-vehicle-me')
  async getVehicleByMe(@Req() req: Request & { user: JwtUserPayload }) {
    // console.log('req: ', req);
    const user = req.user;
    const result = await this.transportProviderService.getVehicleByProviderId(
      user.userId,
    );
    return {
      status: 'success',
      data: result,
    };
  }

  @Post('create-vehicle')
  async createVehicle() {}
}
