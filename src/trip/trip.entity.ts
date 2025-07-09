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
  availabelSeat: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;
}
