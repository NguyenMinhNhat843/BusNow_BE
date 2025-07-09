import { RoleEnum } from 'src/common/enum/RoleEnum';
import { Payment } from 'src/payment/payment.entity';
import { Ticket } from 'src/ticket/ticket.entity';
import { TransportType } from 'src/transportProvider/enum/transportEnum';
import { Vehicle } from 'src/vehicle/vehicle.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column({ nullable: true })
  avatar: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  // Đối với provider thì là ngày thành lập
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

  // Đăng nhập bằng phương thức gì: GOOGLE/FACEBOOK....
  @Column({ nullable: true })
  provider: string;

  @Column({ default: true, nullable: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: TransportType,
    nullable: true,
    default: null,
  })
  type: TransportType | null;

  @Column({ type: 'enum', enum: RoleEnum, default: RoleEnum.USER })
  role: RoleEnum;

  // Một user có thể có nhiều thanh toán
  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  // Một user(PROVIDER) sẽ có nhiều vehicle
  @OneToMany(() => Vehicle, (vehicle) => vehicle.provider)
  vehicles: Vehicle[];
}
