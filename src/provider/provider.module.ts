import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';

@Module({
  imports: [UserModule, VehicleModule],
  providers: [],
  controllers: [],
  exports: [],
})
export class ProviderModule {}
