import { Location } from 'src/location/location.entity';
import { Seat } from 'src/seat/seat.entity';
import { Ticket } from 'src/ticket/ticket.entity';
import { Vehicle } from 'src/vehicle/vehicle.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  tripId: string;

  @Column()
  price: number;

  @Column()
  departTime: Date;

  @Column()
  arriveTime: Date;

  @Column()
  availabelSeat: number;

  @ManyToOne(() => Location, (l) => l.tripsFrom)
  @JoinColumn({
    name: 'fromLocationId',
  })
  from: Location;

  @ManyToOne(() => Location, (l) => l.tripsTo)
  @JoinColumn({ name: 'toLocationId' })
  to: Location;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @OneToMany(() => Seat, (seat) => seat.trip)
  seats: Seat[];

  @OneToOne(() => Ticket, (ticket) => ticket.trip)
  ticket: Ticket;
}
