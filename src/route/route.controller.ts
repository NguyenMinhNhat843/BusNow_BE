import {
  Body,
  Controller,
  Get,
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
import { JwtPayload } from 'src/interface/JwtPayload';

@Controller('route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.PROVIDER, RoleEnum.ADMIN]))
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
}
