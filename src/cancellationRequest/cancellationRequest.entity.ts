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
import { REFUND_STATUS, RefundStatusType } from './type/type';

@Entity()
export class CancellationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Ticket, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  ticket: Ticket;

  @ManyToOne(() => User, { eager: true })
  requestedBy: User;

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
    enum: REFUND_STATUS,
    default: REFUND_STATUS.PENDING,
  })
  status: RefundStatusType;

  @ManyToOne(() => User, { nullable: true, eager: true })
  handledBy?: User; // nhân viên xử lý hoàn tiền

  @Column({ type: 'timestamp', nullable: true })
  refundedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
