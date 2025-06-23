import { Payment } from 'src/payment/payment.entity';
import { Ticket } from 'src/ticket/ticket.entity';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  avatar: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  address: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phoneNumber: string;

  @Column({ unique: true, nullable: true })
  password: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ default: true, nullable: true })
  isActive: boolean;

  @Column({ default: 'user' })
  role: string;

  @OneToOne(() => Ticket, (ticket) => ticket.user)
  ticket: Ticket;

  @OneToOne(() => Payment, (payment) => payment.user)
  payment: Payment;
}
