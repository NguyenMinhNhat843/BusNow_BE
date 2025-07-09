import { Location } from 'src/location/location.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Route {
  @PrimaryGeneratedColumn('uuid')
  providerId: string; // Route nayf cuar nhaf cung caaps naof

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  origin: Location;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  destination: Location;

  @Column()
  duration: number; // đi bao lâu

  @Column()
  restAtDestination: number; // tài xế đến thì được nghỉ bao lâu

  @Column()
  repeatsDay: number; // sau bao nhiêu ngày thì chyaj lại tuyến này, dùng để gen trip tự động

  @Column({ default: true })
  isActive: boolean;
}
