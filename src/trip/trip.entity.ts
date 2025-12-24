import { ApiProperty } from '@nestjs/swagger';
import { TripStatusEnum } from 'src/common/enum/TripStatusEnum';
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
  @ApiProperty()
  tripId: string;

  @Column()
  @ApiProperty()
  price: number;

  @Column({ nullable: true })
  @ApiProperty()
  departDate: Date;

  @Column()
  @ApiProperty()
  availabelSeat: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  @ApiProperty()
  vehicle: Vehicle;

  // Nhận biết chuyến này là đi xuôi hay đi về: go/return
  @Column({ nullable: true, default: 'go' })
  @ApiProperty()
  type: string;

  @Column({
    type: 'enum',
    enum: TripStatusEnum,
    default: TripStatusEnum.PENDING,
  })
  @ApiProperty()
  tripStatus: TripStatusEnum;
}
