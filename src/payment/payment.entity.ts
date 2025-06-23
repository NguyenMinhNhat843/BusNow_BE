import { PaymentMethod } from 'src/common/enum/PaymentMethod';
import { PaymentStatus } from 'src/common/enum/PaymentStatus';
import { Ticket } from 'src/ticket/ticket.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  paymentId: string;

  @Column()
  amount: number; // Số tiền thanh toán

  @Column()
  paymentTime: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  status: string;

  @OneToOne(() => Ticket, (ticket) => ticket.payment)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @OneToOne(() => User, (user) => user.ticket)
  @JoinColumn({ name: 'userId' })
  user: User;
}
