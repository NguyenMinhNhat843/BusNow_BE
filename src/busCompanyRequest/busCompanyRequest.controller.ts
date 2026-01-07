import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateRequestDTO } from './dto/createRequest.dto';
import { GetListDTO } from './dto/getList.dto';
import { UpdateBusCompanyRequestDTO } from './dto/updateCompanyRequest.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/user/guards/roles.guard';
import { User } from '@/user/user.entity';
import { BusCompanyRequestService } from './busCompanyRequest.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('bus-company-requests')
export class BusCompanyRequestController {
  constructor(
    private readonly busCompanyRequestService: BusCompanyRequestService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('licenseFile'))
  create(
    @Body() payload: CreateRequestDTO,
    @UploadedFile() licenseFile: Express.Multer.File,
  ) {
    return this.busCompanyRequestService.createRequest(payload, licenseFile);
  }

  @Get()
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin']))
  getList(@Query() query: GetListDTO) {
    return this.busCompanyRequestService.getList(query);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, new RolesGuard(['admin']))
  update(@Body() payload: UpdateBusCompanyRequestDTO, @Req() req: Request) {
    const user = ((req as any).user as User) || null;
    const adminId = user.userId;
    return this.busCompanyRequestService.updateBusComanyRequest(
      payload,
      adminId,
    );
  }
}
