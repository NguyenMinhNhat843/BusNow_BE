import { TicketStatus } from 'src/common/enum/TicketStatus';
import { LocationDetail } from 'src/locationDetail/locationDetail.entity';
import { Payment } from 'src/payment/payment.entity';
import { Seat } from 'src/seat/seat.entity';
import { Trip } from 'src/trip/trip.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  ticketId: string;

  @Column()
  ticketTime: Date;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.UNPAID,
  })
  status: string;

  @ManyToOne(() => LocationDetail, (ld) => ld.departLocationTickets)
  @JoinColumn({ name: 'departLocationId' })
  departLocation: LocationDetail;

  @ManyToOne(() => LocationDetail, (ld) => ld.arrivalLocationTickets)
  @JoinColumn({ name: 'arrivalLocationId' })
  arrivalLocation: LocationDetail;

  @OneToOne(() => User, (u) => u.ticket)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => Trip, (trip) => trip.ticket)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @OneToOne(() => Seat, (seat) => seat.ticket)
  @JoinColumn({ name: 'seatId' })
  seat: Seat;

  @OneToOne(() => Payment, (payment) => payment.ticket)
  payment: Payment;
}
