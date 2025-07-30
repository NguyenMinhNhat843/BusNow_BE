// mail.service.ts
import { Injectable } from '@nestjs/common';
import { SendTicketEmailDTO } from './dto/sendTicketEmail.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
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
}
