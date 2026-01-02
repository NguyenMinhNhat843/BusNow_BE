import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CreateTIcketDTO } from '@/ticket/dto/createTicketDTO';
import { User } from '@/user/user.entity';

export enum PaymentIntentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
}

@Entity('payment_intents')
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'json' })
  bookingData: CreateTIcketDTO;

  @Column({
    type: 'enum',
    enum: PaymentIntentStatus,
    default: PaymentIntentStatus.PENDING,
  })
  status: PaymentIntentStatus;

  @ManyToOne(() => User, (user) => user.paymentIntens)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
