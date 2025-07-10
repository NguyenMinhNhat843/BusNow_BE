import { TicketStatus } from 'src/common/enum/TicketStatus';
import { StopPoint } from 'src/stopPoint/stopPoint.entity';
import { Payment } from 'src/payment/payment.entity';
import { Seat } from 'src/seat/seat.entity';
import { Trip } from 'src/trip/trip.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  ticketId: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.UNPAID,
  })
  status: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @OneToOne(() => Seat)
  @JoinColumn({ name: 'seatId' })
  seat: Seat;

  @OneToOne(() => Payment, (p) => p.ticket)
  payment: Payment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
