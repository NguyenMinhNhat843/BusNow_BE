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
  from: string;
  to: string;

  @Column()
  availabelSeat: number;
}
