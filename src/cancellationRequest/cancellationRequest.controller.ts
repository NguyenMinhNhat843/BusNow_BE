import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { CancellationRequestService } from './cancellationRequest.service';
import { FilterRefundRequestDto } from './dto/Filter.dto';
import { UpdateCancellationRequestDto } from './dto/update.dto';

@Controller('/refund-request')
export class RefundRequestController {
  constructor(private refundRequestService: CancellationRequestService) {}

  @Get('/limit')
  async getLimit(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.refundRequestService.getLimit(page, limit);
  }

  @Get('filter')
  async filter(@Query() filters: FilterRefundRequestDto) {
    return await this.refundRequestService.filter(filters);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateCancellationRequestDto,
  ) {
    return await this.refundRequestService.update(id, updateData);
  }
}
