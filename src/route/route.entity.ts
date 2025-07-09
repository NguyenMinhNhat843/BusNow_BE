import { Location } from 'src/location/location.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Route {
  @PrimaryGeneratedColumn('uuid')
  routeId: string; // Route nayf cuar nhaf cung caaps naof

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'originId' })
  origin: Location;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'destinationId' })
  destination: Location;

  @Column()
  duration: number; // đi bao lâu

  @Column()
  restAtDestination: number; // tài xế đến thì được nghỉ bao lâu

  @Column()
  repeatsDay: number; // sau bao nhiêu ngày thì chyaj lại tuyến này, dùng để gen trip tự động

  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
