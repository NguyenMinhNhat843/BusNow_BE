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

  @Column({ unique: true })
  code: string; // biển số xe

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

  // Mỗi xe chỉ chạy route và time cố định
  @Column({ nullable: true })
  departHour: string;

  @ManyToOne(() => User, (provider) => provider.vehicles, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @OneToMany(() => Trip, (trip) => trip.vehicle)
  trips: Trip[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
