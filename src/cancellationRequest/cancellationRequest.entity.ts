import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from 'src/ticket/ticket.entity';
import { User } from 'src/user/user.entity';
import { CancellationStatus } from 'src/common/enum/RefundEnum';

@Entity()
export class CancellationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Ticket, { eager: true })
  @JoinColumn()
  ticket: Ticket;

  @ManyToOne(() => User, { eager: true })
  requestedBy: User; // người gửi yêu cầu hủy

  @Column()
  accountHolderName: string;

  @Column()
  bankName: string;

  @Column()
  accountNumber: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({
    type: 'enum',
    enum: CancellationStatus,
    default: CancellationStatus.PENDING,
  })
  status: CancellationStatus;

  @ManyToOne(() => User, { nullable: true, eager: true })
  handledBy?: User; // nhân viên xử lý hoàn tiền

  @Column({ type: 'timestamp', nullable: true })
  refundedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
