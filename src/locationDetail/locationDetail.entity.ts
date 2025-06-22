import { Location } from 'src/location/location.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class LocationDetail {
  @PrimaryGeneratedColumn('uuid')
  locationDetailId: string;

  @Column()
  name: string;

  @ManyToOne(() => Location, (l) => l.locationDetails)
  @JoinColumn({ name: 'locationId' })
  location: Location;
}
