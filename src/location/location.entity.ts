import { LocationDetail } from 'src/locationDetail/locationDetail.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Location {
  @PrimaryGeneratedColumn('uuid')
  locationId: string;

  @Column()
  name: string;

  @OneToMany(
    () => LocationDetail,
    (locationDetail) => locationDetail.location,
    { onDelete: 'CASCADE' },
  )
  locationDetails: LocationDetail[];
}
