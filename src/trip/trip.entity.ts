import { TripStatusEnum } from 'src/enum/TripStatusEnum';
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

  @Column()
  price: number;

  @Column({ nullable: true })
  departDate: Date;

  @Column()
  availabelSeat: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  // Nhận biết chuyến này là đi xuôi hay đi về: go/return
  @Column({ nullable: true, default: 'go' })
  type: string;

  @Column({
    type: 'enum',
    enum: TripStatusEnum,
    default: TripStatusEnum.PENDING,
  })
  tripStatus: TripStatusEnum;
}
