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
import { CancellationRequest } from '@/cancellationRequest/cancellationRequest.entity';
import { TicketStatus } from './type';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  ticketId: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.UNPAID,
  })
  status: TicketStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  // @OneToOne(() => Seat)
  // @JoinColumn({ name: 'seatId' })
  // seat: Seat;
  @ManyToOne(() => Seat, (seat) => seat.tickets)
  @JoinColumn({ name: 'seatId' })
  seat: Seat;

  @OneToOne(() => Payment, (p) => p.ticket)
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @OneToOne(() => CancellationRequest, (cr) => cr.ticket)
  cancellationRequest: CancellationRequest;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
