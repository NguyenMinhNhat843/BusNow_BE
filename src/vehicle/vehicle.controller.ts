import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDTO } from './dto/createVehicleDTO';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/user/guards/roles.guard';
import { RoleEnum } from 'src/common/enum/RoleEnum';
import { ApiBody, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

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
  @ApiBody({ type: CreateVehicleDTO })
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

  @Get('list')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.ADMIN, RoleEnum.PROVIDER]))
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang hiện tại, mặc định 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng item/trang, mặc định 10',
  })
  @ApiQuery({
    name: 'vehicleId',
    required: false,
    type: String,
    description: 'Lọc theo vehicleId cụ thể',
  })
  async getVehicles(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('vehicleId') vehicleId: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const user = req.user;

    const response = await this.vehicleService.getVehicles(
      Number(page),
      Number(limit),
      user.role === RoleEnum.PROVIDER ? user.userId : undefined,
      vehicleId,
    );

    return response;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.ADMIN, RoleEnum.PROVIDER]))
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Xe đã bị xóa thành công' })
  @ApiResponse({ status: 404, description: 'Xe không tồn tại' })
  async deleteVehicle(@Param('id') vehicleId: string) {
    return this.vehicleService.deleteVehicle(vehicleId);
  }
}
