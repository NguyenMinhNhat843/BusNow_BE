import { SeatType } from 'src/common/enum/SeatType';
import { Ticket } from 'src/ticket/ticket.entity';
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
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  seatId: string;

  @Column()
  seatCode: number;

  @Column({ default: false })
  isBooked: boolean;

  // Chỉ có khi type vehicle !== BUS
  @Column({
    type: 'enum',
    enum: SeatType,
    nullable: true,
  })
  typeSeat: string | null;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;
}
