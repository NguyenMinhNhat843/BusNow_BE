import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateRequestDTO } from './dto/createRequest.dto';
import { BusCompanyRequestService } from './busCOmpanyRequest.service';
import { GetListDTO } from './dto/getList.dto';
import { UpdateBusCompanyRequestDTO } from './dto/updateCompanyRequest.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/user/guards/roles.guard';
import { User } from '@/user/user.entity';

@Controller('bus-company-requests')
@UseGuards(JwtAuthGuard, new RolesGuard(['admin']))
export class BusCompanyRequestController {
  constructor(
    private readonly busCompanyRequestService: BusCompanyRequestService,
  ) {}

  @Post()
  create(@Body() payload: CreateRequestDTO) {
    return this.busCompanyRequestService.createRequest(payload);
  }

  @Get()
  getList(@Query() query: GetListDTO) {
    return this.busCompanyRequestService.getList(query);
  }

  @Patch()
  update(@Body() payload: UpdateBusCompanyRequestDTO, @Req() req: Request) {
    const user = ((req as any).user as User) || null;
    const adminId = user.userId;
    return this.busCompanyRequestService.updateBusComanyRequest(
      payload,
      adminId,
    );
  }
}
