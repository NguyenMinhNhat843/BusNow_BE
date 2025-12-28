import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CancellationRequestService } from './cancellationRequest.service';
import { UpdateCancellationRequestDto } from './dto/update.dto';
import { SearchRefundRequestDTO } from './dto/SearchRefundRequestDTO';

@Controller('/refund-request')
export class RefundRequestController {
  constructor(private refundRequestService: CancellationRequestService) {}

  @Post('/search')
  async searchRefundRequest(@Body() body: SearchRefundRequestDTO) {
    return await this.refundRequestService.searchRefundRequest(body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateCancellationRequestDto,
  ) {
    return await this.refundRequestService.update(id, updateData);
  }
}
