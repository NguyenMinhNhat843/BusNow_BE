import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { Response } from 'express';
import { CreatePaymentDto } from './dto/createPaymentDTO';
import * as crypto from 'crypto';
import * as qs from 'qs';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaymentIntent,
  PaymentIntentStatus,
} from '@/paymentIntent/paymentIntent.entity';
import { Repository } from 'typeorm';
import { TicketService } from '@/ticket/ticket.service';
import { User } from '@/user/user.entity';
import { TicketStatus } from '@/ticket/type';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/user/guards/roles.guard';
import { RoleEnum } from '@/common/enum/RoleEnum';
import { PaymentStatus } from '@/common/enum/PaymentStatus';

@ApiTags('VNPAY')
@Controller('vnpay')
export class VnpayController {
  constructor(
    private readonly vnpayService: VnpayService,

    @InjectRepository(PaymentIntent)
    private paymentIntentRepo: Repository<PaymentIntent>,
    private ticketService: TicketService,
  ) {}

  @Post('create-payment-url')
  @UseGuards(JwtAuthGuard, new RolesGuard([RoleEnum.USER]))
  @ApiProperty({ type: CreatePaymentDto })
  async createPaymentUrl(@Body() dto: CreatePaymentDto, @Req() req: any) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const user = req.user as User | undefined;

    const url = await this.vnpayService.createPaymentUrl(
      dto,
      ipAddr,
      user?.userId,
    );
    return { url };
  }

  @Get('callback')
  async vnpayCallback(@Query() query: any, @Res() res: Response) {
    let vnpParams = { ...query };

    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    vnpParams = this.vnpayService.sortObject(vnpParams);

    const secretKey = process.env.VNP_HASH_SECRET!;
    const signData = qs.stringify(vnpParams, { encode: false });

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const intentId = vnpParams['vnp_TxnRef'];
    const intent = await this.paymentIntentRepo.findOne({
      where: { id: intentId },
      relations: {
        user: true,
      },
    });

    if (!intent) {
      return res.send('Không tìm thấy giao dịch');
    }

    if (intent.status === PaymentIntentStatus.SUCCESS) {
      return res.send('Đơn hàng đã được xử lý');
    }

    if (secureHash === signed) {
      const responseCode = vnpParams['vnp_ResponseCode'];

      if (responseCode === '00') {
        await this.ticketService.createTicket(
          { ...intent.bookingData, statusPayment: PaymentStatus.COMPLETED },
          intent.user,
          TicketStatus.PAID,
        );
        intent.status = PaymentIntentStatus.SUCCESS;
        return res.redirect(
          302,
          `${process.env.URL_FE}/thanh-toan?status=success`,
        );
      } else {
        intent.status = PaymentIntentStatus.FAIL;
        return res.redirect(
          302,
          `${process.env.URL_FE}/thanh-toan?status=fail`,
        );
      }
    } else {
      return res.send('Checksum không hợp lệ!');
    }
  }
}
