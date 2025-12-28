import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Between, ILike, Repository } from 'typeorm';
import { CancellationRequest } from './cancellationRequest.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from 'src/ticket/ticket.entity';
import { User } from 'src/user/user.entity';
import { UpdateCancellationRequestDto } from './dto/update.dto';
import { SearchRefundRequestDTO } from './dto/SearchRefundRequestDTO';
import { REFUND_STATUS } from './type/type';

@Injectable()
export class CancellationRequestService {
  constructor(
    @InjectRepository(CancellationRequest)
    private refundRepo: Repository<CancellationRequest>,
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: {
    ticket: Ticket;
    requestedBy: User;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    note?: string;
  }) {
    const cancellation = this.refundRepo.create({
      ticket: dto.ticket,
      requestedBy: dto.requestedBy,
      accountHolderName: dto.accountHolderName,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      note: dto.note || '',
      status: REFUND_STATUS.PENDING,
    });

    await this.refundRepo.save(cancellation);

    return {
      message: 'Gửi yêu cầu hủy vé thành công.',
      requestId: cancellation.id,
    };
  }

  async searchRefundRequest(payload: SearchRefundRequestDTO) {
    const { limit = 10, page = 1, phoneNumber, status } = payload;

    const safeLimit = Math.min(limit, 50);
    const skip = (page - 1) * safeLimit;

    const [data, total] = await this.refundRepo.findAndCount({
      where: {
        status,
        ticket: {
          user: {
            phoneNumber,
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
      take: safeLimit,
      skip,
    });

    return {
      data,
      total,
    };
  }

  async update(id: string, dto: UpdateCancellationRequestDto) {
    const cancellation = await this.refundRepo.findOne({ where: { id } });
    if (!cancellation) {
      throw new NotFoundException('Cancellation request not found');
    }

    // Quan hệ: ticket
    if (dto.ticketId) {
      const ticket = await this.ticketRepo.findOne({
        where: { ticketId: dto.ticketId },
      });
      if (!ticket) throw new NotFoundException('Ticket not found');
      cancellation.ticket = ticket;
    }

    // Quan hệ: requestedBy
    if (dto.requestedById) {
      const user = await this.userRepo.findOne({
        where: { userId: dto.requestedById },
      });
      if (!user) throw new NotFoundException('RequestedBy user not found');
      cancellation.requestedBy = user;
    }

    // Quan hệ: handledBy
    if (dto.handledById) {
      const handler = await this.userRepo.findOne({
        where: { userId: dto.handledById },
      });
      if (!handler) throw new NotFoundException('HandledBy user not found');
      cancellation.handledBy = handler;
    }

    // Field thường
    if (dto.accountHolderName !== undefined)
      cancellation.accountHolderName = dto.accountHolderName;
    if (dto.bankName !== undefined) cancellation.bankName = dto.bankName;
    if (dto.accountNumber !== undefined)
      cancellation.accountNumber = dto.accountNumber;
    if (dto.note !== undefined) cancellation.note = dto.note;
    if (dto.status !== undefined) cancellation.status = dto.status;
    if (dto.refundedAt !== undefined) cancellation.refundedAt = dto.refundedAt;

    return await this.refundRepo.save(cancellation);
  }
}
