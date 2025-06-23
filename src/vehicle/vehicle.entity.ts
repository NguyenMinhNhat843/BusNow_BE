import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransportType } from 'src/transportProvider/enum/transportEnum';
import { TransportProvider } from 'src/transportProvider/transportProvider.entity';
import { Trip } from 'src/trip/trip.entity';
import { VehicleTypeBus } from 'src/common/enum/vehicleTypeForBUS';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  vehicleId: string;

  @Column()
  code: string;

  @Column()
  totalSeat: number;

  @Column({
    type: 'enum',
    enum: TransportType,
    default: TransportType.BUS,
  })
  type: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(
    () => TransportProvider, // Trỏ tới entity cha là transportProvider
    (provider) => provider.vehicles, // Trỏ tới mảng vehicles trong transportProvider
    { onDelete: 'CASCADE' }, // Nếu xóa provider thì xóa hết vehicles liên quan
  )
  @JoinColumn({ name: 'transportProviderId' })
  transportProvider: TransportProvider;

  @OneToMany(() => Trip, (trip) => trip.vehicle)
  trips: Trip[];

  // Chỉ có khi là BUS
  @Column({
    type: 'enum',
    enum: VehicleTypeBus,
    nullable: true,
  })
  subType: string;
}
