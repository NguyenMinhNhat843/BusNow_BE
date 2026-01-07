import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BusCompanyRequestStatus } from './type';

@Entity()
export class BusCompanyRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Tên nhà xe
  @Column({ name: 'company_name' })
  companyName: string;

  // Địa chỉ
  @Column()
  address: string;

  // Số điện thoại
  @Column({ name: 'phone_number' })
  phoneNumber: string;

  // Email liên hệ / dùng tạo account sau này
  @Column()
  email: string;

  // Người đại diện pháp luật
  @Column({ name: 'representative_name' })
  representativeName: string;

  // Số giấy phép kinh doanh
  @Column({ name: 'license_number' })
  licenseNumber: string;

  // File giấy phép (URL S3 / Cloudinary / local)
  @Column({ name: 'license_file_url' })
  licenseFileUrl: string;

  // Trạng thái duyệt
  @Column({
    type: 'enum',
    enum: BusCompanyRequestStatus,
    default: BusCompanyRequestStatus.PENDING,
  })
  status: BusCompanyRequestStatus;

  // Lý do từ chối (nếu có)
  @Column({ name: 'reject_reason', nullable: true })
  rejectReason: string;

  // Admin duyệt
  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  // Thời điểm duyệt
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
