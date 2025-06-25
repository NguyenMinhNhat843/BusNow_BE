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

  @ManyToOne(() => LocationDetail)
  @JoinColumn({ name: 'departLocationId' })
  departLocation: LocationDetail;

  @ManyToOne(() => LocationDetail)
  @JoinColumn({ name: 'arrivalLocationId' })
  arrivalLocation: LocationDetail;

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

  @Column({ nullable: true })
  seatCode: string;
}
