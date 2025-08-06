import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CancellationRequestService } from './cancellationRequest.service';
import { FilterRefundRequestDto } from './dto/Filter.dto';

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
}
