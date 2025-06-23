import { Module } from '@nestjs/common';
import { TypeOrmDataSourceFactory, TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { S3Module } from './s3/s3.module';
import { TransportProviderModule } from './transportProvider/transport.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { Trip } from './trip/trip.entity';
import { TripModule } from './trip/trip.module';
import { User } from './user/user.entity';
import { TransportProvider } from './transportProvider/transportProvider.entity';
import { Vehicle } from './vehicle/vehicle.entity';
import { Location } from './location/location.entity';
import { LocationModule } from './location/location.module';
import { LocationDetailModule } from './locationDetail/locationDetail.module';
import { SeatModule } from './seat/seat.module';
import { TicketModule } from './ticket/ticket.module';
import { PaymentModue } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Để biến môi trường có thể sử dụng toàn cục
      envFilePath: '.env', // Đường dẫn đến file .env
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '123456789',
      database: process.env.DB_NAME || 'BusNow',
      autoLoadEntities: true,
      synchronize: true, // Chỉ sử dụng trong môi trường phát triển
    }),
    UserModule,
    AuthModule,
    TransportProviderModule,
    VehicleModule,
    TripModule,
    LocationModule,
    LocationDetailModule,
    SeatModule,
    TicketModule,
    PaymentModue,
    S3Module,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
