import { Location } from 'src/location/location.entity';
import { Vehicle } from 'src/vehicle/vehicle.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  tripId: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column()
  price: number;

  @Column()
  departTime: Date;

  @Column()
  arriveTime: Date;

  @ManyToOne(() => Location, (l) => l.tripsFrom)
  @JoinColumn({
    name: 'fromLocationId',
  })
  from: Location;

  @ManyToOne(() => Location, (l) => l.tripsTo)
  @JoinColumn({ name: 'toLocationId' })
  to: Location;

  @Column()
  availabelSeat: number;
}
