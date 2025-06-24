import { LocationDetail } from 'src/locationDetail/locationDetail.entity';
import { Trip } from 'src/trip/trip.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Location {
  @PrimaryGeneratedColumn('uuid')
  locationId: string;

  @Column()
  name: string;

  // // Mối quan hệ với Trip, nơi Location là điểm đón
  // @OneToMany(() => Trip, (trip) => trip.from)
  // tripsFrom: Trip[];

  // // Mối quan hệ với Trip, nơi Location là điểm đến
  // @OneToMany(() => Trip, (trip) => trip.to)
  // tripsTo: Trip[];

  @OneToMany(
    () => LocationDetail,
    (locationDetail) => locationDetail.location,
    { onDelete: 'CASCADE' },
  )
  locationDetails: LocationDetail[];
}
