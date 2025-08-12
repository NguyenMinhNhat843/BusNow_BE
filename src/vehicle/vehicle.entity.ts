import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from 'src/trip/trip.entity';
import { User } from 'src/user/user.entity';
import { BusTypeEnum } from 'src/common/enum/BusTypeEnum';
import { Route } from 'src/route/route.entity';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  vehicleId: string;

  // biển số xe
  @Column({ unique: true })
  code: string;

  // số ghế
  @Column()
  totalSeat: number;

  @Column({ default: true })
  isActive: boolean;

  // xe VIP/STANDARD/LIMOUSINE
  @Column({ type: 'enum', enum: BusTypeEnum, default: BusTypeEnum.STANDARD })
  busType: BusTypeEnum;

  // Xe này chạy tuyến đường nào, mỗi xe chỉ chạy 1 tuyến đường
  @ManyToOne(() => Route)
  @JoinColumn({ name: 'routeId' })
  route: Route;

  // Mỗi xe chỉ chyaj route và time cố định để generate trip tự động
  @Column({ nullable: true })
  departHour: string;

  @ManyToOne(
    () => User, // Trỏ tới entity cha là transportProvider
    (provider) => provider.vehicles, // Trỏ tới mảng vehicles trong transportProvider
    { onDelete: 'CASCADE', nullable: true }, // Nếu xóa provider thì xóa hết vehicles liên quan
  )
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @OneToMany(() => Trip, (trip) => trip.vehicle)
  trips: Trip[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
