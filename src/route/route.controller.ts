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
import { RouteService } from './route.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/user/guards/roles.guard';
import { RoleEnum } from 'src/common/enum/RoleEnum';
import { CreateRouteDTO } from './dto/createRouteDTO';
import { JwtPayload } from 'src/common/type/JwtPayload';
import { ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.PROVIDER, RoleEnum.ADMIN]))
  @ApiBody({ type: CreateRouteDTO })
  async createRoute(
    @Body() body: CreateRouteDTO,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const user = req.user;
    const result = await this.routeService.createRoute({
      ...body,
      providerId: user.userId,
    });
    return {
      status: 'success',
      data: result,
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
  async getRoutes(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const { user } = req;

    const response = await this.routeService.getRoutes(
      Number(page),
      Number(limit),
      user.role === RoleEnum.PROVIDER ? user.userId : undefined,
    );

    return {
      status: 'success',
      ...response,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.ADMIN, RoleEnum.PROVIDER]))
  @ApiParam({ name: 'id', type: String })
  async deleteRoute(@Param('id') routeId: string) {
    return this.routeService.deleteRoute(routeId);
  }
}
