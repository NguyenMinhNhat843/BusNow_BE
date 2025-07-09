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
import { User } from 'src/user/user.entity';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  vehicleId: string;

  @Column({ unique: true })
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

  // Ban đầu là 1 vehicle thuộc về 1 provider
  // Nhưng bây giwof gộp provider vô bảng user với role = 'provider' luôn r
  // Nên sẽ bỏ
  @ManyToOne(
    () => User, // Trỏ tới entity cha là transportProvider
    (provider) => provider.vehicles, // Trỏ tới mảng vehicles trong transportProvider
    { onDelete: 'CASCADE', nullable: true }, // Nếu xóa provider thì xóa hết vehicles liên quan
  )
  @JoinColumn({ name: 'transportProviderId' })
  transportProvider: TransportProvider;

  // Cái này mới giữ lại
  @ManyToOne(
    () => User, // Trỏ tới entity cha là transportProvider
    (provider) => provider.vehicles, // Trỏ tới mảng vehicles trong transportProvider
    { onDelete: 'CASCADE', nullable: true }, // Nếu xóa provider thì xóa hết vehicles liên quan
  )
  @JoinColumn({ name: 'providerId' })
  provider: User;

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
