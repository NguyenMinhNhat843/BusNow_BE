import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRequestDTO } from './dto/createRequest.dto';
import { Repository } from 'typeorm';
import { BusCompanyRequestEntity } from './busCompanyRequest.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BusCompanyRequestStatus } from './type';
import { GetListDTO } from './dto/getList.dto';
import { UpdateBusCompanyRequestDTO } from './dto/updateCompanyRequest.dto';
import { S3Service } from '@/s3/s3.service';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class BusCompanyRequestService {
  constructor(
    @InjectRepository(BusCompanyRequestEntity)
    private busCompanyRequestRepository: Repository<BusCompanyRequestEntity>,
    private s3Service: S3Service,
    private mailService: MailService,
  ) {}

  async getList(payload: GetListDTO) {
    const {
      email,
      phone,
      requestId,
      status,
      fromDate,
      toDate,
      sortBy,
      page = 1,
      limit = 10,
    } = payload;

    const qb = this.busCompanyRequestRepository.createQueryBuilder('req');

    /** ================= FILTER ================= */

    if (requestId) {
      qb.andWhere('req.id = :requestId', { requestId });
    }

    if (email) {
      qb.andWhere('req.email ILIKE :email', {
        email: `%${email}%`,
      });
    }

    if (phone) {
      qb.andWhere('req.phoneNumber ILIKE :phone', {
        phone: `%${phone}%`,
      });
    }

    if (status) {
      qb.andWhere('req.status = :status', { status });
    }

    if (fromDate) {
      qb.andWhere('req.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      qb.andWhere('req.createdAt <= :toDate', { toDate });
    }

    /** ================= SORT ================= */

    const sortMap: Record<string, string> = {
      createdAt: 'req.createdAt',
      email: 'req.email',
      status: 'req.status',
    };

    qb.orderBy(sortMap[sortBy || ''] ?? 'req.createdAt', 'DESC');

    /** ================= PAGINATION ================= */

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
    };
  }

  async createRequest(
    payload: CreateRequestDTO,
    licenseFile: Express.Multer.File,
  ) {
    // Check trùng email / phone
    const existed = await this.busCompanyRequestRepository.findOne({
      where: [{ email: payload.email }, { phoneNumber: payload.phoneNumber }],
    });

    if (existed) {
      throw new BadRequestException(
        'Email hoặc số điện thoại đã được sử dụng để đăng ký',
      );
    }

    if (!licenseFile) {
      throw new BadRequestException('Thiếu file giấy phép');
    }

    // Upload S3
    const licenseFileUrl = await this.s3Service.uploadFile(
      licenseFile,
      'bus-company-licenses',
    );

    // Tạo request
    const request = this.busCompanyRequestRepository.create({
      ...payload,
      licenseFileUrl,
      status: BusCompanyRequestStatus.PENDING,
    });

    // Lưu DB
    const saved = await this.busCompanyRequestRepository.save(request);

    return saved;
  }

  async updateBusComanyRequest(
    payload: UpdateBusCompanyRequestDTO,
    adminId: string,
  ) {
    const { id, status, rejectReason } = payload;

    const request = await this.busCompanyRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy request nhà xe');
    }

    // Không cho update lại nếu đã xử lý
    if (request.status !== BusCompanyRequestStatus.PENDING) {
      throw new BadRequestException('Request này đã được xử lý');
    }

    // Reject phải có lý do
    if (status === BusCompanyRequestStatus.REJECTED && !rejectReason) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối');
    }

    request.status = status;
    request.rejectReason =
      status === BusCompanyRequestStatus.REJECTED ? rejectReason || '' : '';

    // Approved
    if (status === BusCompanyRequestStatus.APPROVED) {
      request.approvedAt = new Date();
      request.approvedBy = adminId;
    }

    await this.busCompanyRequestRepository.save(request);

    return {
      message: 'Cập nhật trạng thái request thành công',
    };
  }
}
