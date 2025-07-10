import { StopPoint } from 'src/stopPoint/stopPoint.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Location {
  @PrimaryGeneratedColumn('uuid')
  locationId: string;

  @Column()
  name: string;

  @OneToMany(() => StopPoint, (sp) => sp.city, { onDelete: 'CASCADE' })
  stopPoints: StopPoint[];
}
