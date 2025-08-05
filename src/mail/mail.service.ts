// mail.service.ts
import { Injectable } from '@nestjs/common';
import { SendTicketEmailDTO } from './dto/sendTicketEmail.dto';
import * as nodemailer from 'nodemailer';
import { BankingInfoDTO } from './dto/bankingInfo.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private cacheService: RedisService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ADMIN_USERNAME,
        pass: process.env.GMAIL_ADMIN_PASSWORD,
      },
    });
  }

  async sendTicketEmail(to: string, order: SendTicketEmailDTO) {
    const html = `
      <h2>Thông tin vé đặt</h2>
      <p><strong>Họ tên:</strong> ${order.fullName}</p>
      <p><strong>Nhà xe:</strong> ${order.busName}</p>
      <p><strong>Tuyến:</strong> ${order.origin} → ${order.destination}</p>
      <p><strong>Ghế:</strong> ${order.seatCode}</p>
      <p><strong>Giá:</strong> ${order.price.toLocaleString()}₫</p>
      <p><strong>Giờ khởi hành:</strong> ${new Date(order.departDate).toLocaleString()}</p>
    `;

    const info = await this.transporter.sendMail({
      from: `"BusNow" <${process.env.GMAIL_ADMIN_USERNAME}>`, // tên người gửi (không cần thật với Mailtrap)
      to,
      subject: 'Vé xe của bạn đã được đặt thành công',
      html,
    });
  }

  async sendEmailCancleTicket(
    to: string,
    order: SendTicketEmailDTO,
    bankingInfo: BankingInfoDTO,
  ) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 số
    // Lưu vào redis
    await this.cacheService.setRedis(
      `cancel-ticket:${order.ticketId}`,
      otp,
      300,
    );

    const subject = 'Xác thực yêu cầu hủy vé';
    const content = `
      <h2>Yêu cầu hủy vé</h2>
      <h2>Thông tin vé đặt</h2>
      <p><strong>Mã vé:</strong> ${order.ticketId}</p>
      <p><strong>Họ tên:</strong> ${order.fullName}</p>
      <p><strong>Nhà xe:</strong> ${order.busName}</p>
      <p><strong>Tuyến:</strong> ${order.origin} → ${order.destination}</p>
      <p><strong>Ghế:</strong> ${order.seatCode}</p>
      <p><strong>Giá:</strong> ${order.price.toLocaleString()}₫</p>
      <p><strong>Giờ khởi hành:</strong> ${new Date(order.departDate).toLocaleString()}</p>

      <h3>Thông tin hoàn tiền</h3>
      <p><strong>Tên chủ tài khoản:</strong> ${bankingInfo.bankAccountName}</p>
      <p><strong>Số tài khoản:</strong> ${bankingInfo.accountNumber}</p>
      <p><strong>Ngân hàng:</strong> ${bankingInfo.bankName}</p>
      
      <p><strong>Mã OTP:</strong> ${otp}</p>
      <p><i>Lưu ý: Mã OTP chỉ có hiệu lực trong 5 phút</i></p>
    `;

    const info = await this.transporter.sendMail({
      from: `"BusNow" <${process.env.GMAIL_ADMIN_USERNAME}>`, // tên người gửi (không cần thật với Mailtrap)
      to,
      subject,
      html: content,
    });
  }
}
