import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Between, ILike, Repository } from 'typeorm';
import { CancellationRequest } from './cancellationRequest.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketService } from 'src/ticket/ticket.service';
import { UserService } from 'src/user/user.service';
import { CancellationStatus } from 'src/common/enum/RefundEnum';
import { Ticket } from 'src/ticket/ticket.entity';
import { User } from 'src/user/user.entity';
import { FilterRefundRequestDto } from './dto/Filter.dto';

@Injectable()
export class CancellationRequestService {
  constructor(
    @InjectRepository(CancellationRequest)
    private refundRepo: Repository<CancellationRequest>,
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
      status: CancellationStatus.PENDING,
    });

    await this.refundRepo.save(cancellation);

    return {
      message: 'Gửi yêu cầu hủy vé thành công.',
      requestId: cancellation.id,
    };
  }

  async getLimit(page: number, limit: number) {
    const [data, total] = await this.refundRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['requestedBy'],
    });

    return {
      status: 'success',
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  async filter(filters: FilterRefundRequestDto) {
    const { page, limit, phoneNumber, status, startDate, endDate } = filters;

    const where: any = {};

    if (phoneNumber) {
      where.requestedBy = { phoneNumber: ILike(`%${phoneNumber}%`) };
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = Between(new Date(startDate), new Date());
    }

    const [data, total] = await this.refundRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['requestedBy'],
    });

    return {
      status: 'success',
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }
}
