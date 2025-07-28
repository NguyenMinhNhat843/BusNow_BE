import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { S3Module } from './s3/s3.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { TripModule } from './trip/trip.module';
import { LocationModule } from './location/location.module';
import { StopPointModule } from './stopPoint/stopPoint.module';
import { SeatModule } from './seat/seat.module';
import { TicketModule } from './ticket/ticket.module';
import { PaymentModue } from './payment/payment.module';
import { ProviderModule } from './provider/provider.module';
import { RouteModule } from './route/route.module';
import { ApplicationModule } from './application/application.module';

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
      synchronize: true, // Chỉ sử dụng trong môi trường phát triển ádsad
    }),
    AuthModule,
    UserModule,
    ProviderModule,
    VehicleModule,
    RouteModule,
    TripModule,
    LocationModule,
    StopPointModule,
    SeatModule,
    TicketModule,
    PaymentModue,
    S3Module,
    ApplicationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
