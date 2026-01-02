import * as crypto from 'crypto';
import * as qs from 'qs';
import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto } from './dto/createPaymentDTO';
import {
  PaymentIntent,
  PaymentIntentStatus,
} from '@/paymentIntent/paymentIntent.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/user/user.entity';

@Injectable()
export class VnpayService {
  constructor(
    private config: ConfigService,
    @InjectRepository(PaymentIntent)
    private paymentIntentRepo: Repository<PaymentIntent>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  sortObject(obj: Record<string, any>) {
    const sorted: Record<string, string> = {};
    const keys: string[] = [];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        keys.push(encodeURIComponent(key));
      }
    }

    keys.sort();

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }

    return sorted;
  }

  async createPaymentUrl(
    dto: CreatePaymentDto,
    ipAddr = '127.0.0.1',
    userId?: string,
  ) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    const tmnCode = process.env.VNP_TMN_CODE!;
    const secretKey = process.env.VNP_HASH_SECRET!;
    const vnpUrl = process.env.VNP_URL!;
    const returnUrl = process.env.VNP_RETURN_URL!;

    const user = await this.userRepo.findOneByOrFail({ userId });
    const intent = await this.paymentIntentRepo.save({
      amount: dto.amount,
      bookingData: dto.bookingInfo,
      status: PaymentIntentStatus.PENDING,
      user,
    });

    let vnpParams: Record<string, any> = {};

    vnpParams['vnp_Version'] = '2.1.0';
    vnpParams['vnp_Command'] = 'pay';
    vnpParams['vnp_TmnCode'] = tmnCode;
    vnpParams['vnp_Locale'] = 'vn';
    vnpParams['vnp_CurrCode'] = 'VND';
    vnpParams['vnp_TxnRef'] = intent.id;
    vnpParams['vnp_OrderInfo'] = dto.orderInfo;
    vnpParams['vnp_OrderType'] = 'other';
    vnpParams['vnp_Amount'] = dto.amount * 100;
    vnpParams['vnp_ReturnUrl'] = returnUrl;
    vnpParams['vnp_IpAddr'] = ipAddr;
    vnpParams['vnp_CreateDate'] = createDate;

    // sort params
    vnpParams = this.sortObject(vnpParams);

    // ký hash
    const signData = qs.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams['vnp_SecureHash'] = signed;

    // build url
    const paymentUrl =
      vnpUrl + '?' + qs.stringify(vnpParams, { encode: false });

    return paymentUrl;
  }
}
