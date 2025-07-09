import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDTO } from './dto/createVehicleDTO';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/user/guards/roles.guard';
import { RoleEnum } from 'src/common/enum/RoleEnum';

interface JwtPayload {
  userId: string;
  email: string;
  role: RoleEnum;
}

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.ADMIN, RoleEnum.PROVIDER]))
  async createVehicle(
    @Body() body: CreateVehicleDTO,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const user = req.user;
    const response = await this.vehicleService.createVehicle({
      ...body,
      providerId: user.userId,
    });
    return {
      status: 'success',
      data: response,
    };
  }
}
