import { Injectable } from '@nestjs/common';
import { TripService } from './trip.service';
import { DeleteTripBeforeDate } from './dto/deleteTripBeforeDate.dto';
import { DataSource, Repository } from 'typeorm';
import { Trip } from './trip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from 'src/ticket/ticket.entity';

@Injectable()
export class TripBussinessService {
  constructor(
    @InjectRepository(Trip)
    private tripRepo: Repository<Trip>,
    private dataSource: DataSource,
  ) {}

  async deleteTripsBeforeDate(data: DeleteTripBeforeDate) {
    const { date } = data;

    // Xóa trips và ticket trong trip đó
    const result = await this.dataSource.transaction(async (manager) => {
      // Xóa ticket thuộc các tríp hết hạn
      await manager
        .createQueryBuilder()
        .delete()
        .from(Ticket)
        .where(
          `"tripId" IN (select "tripId" from "trip" where "departDate" < :date)`,
          {
            date,
          },
        )
        .execute();

      // Xóa trip
      const deleteTripResult = await manager
        .createQueryBuilder()
        .delete()
        .from(Trip)
        .where(`departDate < :date`, { date })
        .execute();

      return deleteTripResult;
    });

    return result;
  }
}
