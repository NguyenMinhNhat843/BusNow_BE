import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TransportType } from './enum/transportEnum';
import { Vehicle } from 'src/vehicle/vehicle.entity';

@Entity()
export class TransportProvider {
  @PrimaryGeneratedColumn('uuid')
  providerId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column()
  phoneNumber: string;

  @Column()
  email: string;

  @Column()
  address: string;

  @Column({
    type: 'enum',
    enum: TransportType,
    default: TransportType.BUS,
  })
  type: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.transportProvider)
  vehicles: Vehicle[];
}
