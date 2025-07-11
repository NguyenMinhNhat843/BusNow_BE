import { StopPointEnum } from 'src/enum/StopPointsEnum';
import { Location } from 'src/location/location.entity';
import { Route } from 'src/route/route.entity';
import { Ticket } from 'src/ticket/ticket.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class StopPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  cityId: string;

  @ManyToMany(() => Route, (route) => route.stopPoints)
  routes: Route[];

  @ManyToOne(() => Location, (l) => l.stopPoints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cityId' })
  city: Location;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
