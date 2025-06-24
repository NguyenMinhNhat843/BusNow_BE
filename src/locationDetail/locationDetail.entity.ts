import { Location } from 'src/location/location.entity';
import { Ticket } from 'src/ticket/ticket.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
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
