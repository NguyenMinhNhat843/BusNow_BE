import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CancellationRequest } from './cancellationRequest.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketService } from 'src/ticket/ticket.service';
import { UserService } from 'src/user/user.service';
import { CancellationStatus } from 'src/common/enum/RefundEnum';
import { Ticket } from 'src/ticket/ticket.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class CancellationRequestService {
  constructor(
    @InjectRepository(CancellationRequest)
    private cancellationRequestRepo: Repository<CancellationRequest>,
  ) {}

  async create(dto: {
    ticket: Ticket;
    requestedBy: User;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    note?: string;
  }) {
    // const ticket = await this.ticketService.findTicket(ticketId);

    // if (!ticket) {
    //   throw new NotFoundException('Không tìm thấy vé.');
    // }

    // // Kiểm tra đã có yêu cầu huỷ chưa
    // const existingRequest = await this.cancellationRequestRepo.findOne({
    //   where: { ticket: { ticketId } },
    // });

    // if (existingRequest) {
    //   throw new BadRequestException(
    //     'Vé này đã có yêu cầu hủy. Vui lòng đợi hoàn tiền',
    //   );
    // }

    // //   Kiểm tra người gửi yêu cầu hủy có hợp lệ ko
    // const user = await this.userService.findUserByEmail(userId);
    // if (!user) {
    //   throw new NotFoundException('Không tìm thấy người dùng.');
    // }

    const cancellation = this.cancellationRequestRepo.create({
      ticket: dto.ticket,
      requestedBy: dto.requestedBy,
      accountHolderName: dto.accountHolderName,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      note: dto.note || '',
      status: CancellationStatus.PENDING,
    });

    await this.cancellationRequestRepo.save(cancellation);

    return {
      message: 'Gửi yêu cầu hủy vé thành công.',
      requestId: cancellation.id,
    };
  }
}
