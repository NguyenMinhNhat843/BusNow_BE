import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Between, Brackets, Repository } from 'typeorm';
import { Trip } from './trip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createTripDTO } from './dto/createTripDTO';
import { SearchTripDTO } from './dto/searchTripDTO';
import { LocationService } from 'src/location/locationService';
import { VehicleService } from 'src/vehicle/vehicle.service';
import { SortByEnum } from 'src/common/enum/SortByEnum';
import { GenTripDTO } from './dto/genTripDTO';
import { Vehicle } from 'src/vehicle/vehicle.entity';
import { addDays, addHours, addMinutes, format } from 'date-fns';
import { DeleteTripDTO } from './dto/deleteTripDTO';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    private locationService: LocationService,
    private vehicleService: VehicleService,
  ) {}

  async findTripByID(id: string) {
    const result = await this.tripRepository.findOne({
      where: { tripId: id },
      relations: ['vehicle'],
    });

    return result;
  }

  async findTripByVehicleId(vehicleId: string, page?: number, limit?: number) {
    const options: any = {
      where: {
        vehicle: { vehicleId },
      },
      relations: ['vehicle'],
      order: {
        departDate: 'ASC',
      },
    };

    if (page && limit) {
      options.skip = (page - 1) * limit;
      options.take = limit;
    }

    const [trips, total] = await this.tripRepository.findAndCount(options);

    return {
      status: 'success',
      pagination:
        page && limit
          ? {
              page,
              limit,
              total,
              totalPage: Math.ceil(total / limit),
            }
          : null,
      data: trips,
    };
  }

  // Lọc trip theo from/to/time
  async searchTrip(data: SearchTripDTO) {
    const {
      fromLocationId,
      toLocationId,
      departTime,
      page,
      limit,
      busType,
      minPrice,
      maxPrice,
      sortBy,
    } = data;
    // Kiểm tra location from có tồn tại ko
    const [from, to] = await Promise.all([
      this.locationService.findLocationByNameOrId(fromLocationId),
      this.locationService.findLocationByNameOrId(toLocationId),
    ]);
    if (!from || !to) {
      throw new NotFoundException(
        'Địa điểm khởi hành hoặc đến không tồn tại trong hệ thống!!',
      );
    }
    // Tạo khoảng thời gian trong ngày
    const now = new Date();
    const startTime =
      new Date(departTime).toDateString() === now.toDateString()
        ? now
        : new Date(departTime);
    const endTime = new Date(departTime);
    endTime.setHours(23, 59, 59, 999);
    // kiểm tra departTime hợp lệ
    if (startTime < now) {
      throw new BadRequestException(
        'Thời gian khởi hành phải lớn hơn thời gian hiện tại!!',
      );
    }

    // query trips
    const query = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.vehicle', 'v')
      .leftJoinAndSelect('v.route', 'r')
      .leftJoinAndSelect('v.provider', 'provider')
      .leftJoinAndSelect('r.origin', 'o')
      .leftJoinAndSelect('r.destination', 'd')
      .where(
        new Brackets((qb) => {
          qb.where(
            `(o.locationId = :from AND d.locationId = :to AND trip.type = 'go')`,
            { from: fromLocationId, to: toLocationId },
          ).orWhere(
            `(o.locationId = :to AND d.locationId = :from AND trip.type = 'return')`,
            { to: toLocationId, from: fromLocationId },
          );
        }),
      )
      .andWhere('trip.departDate BETWEEN :start AND :end', {
        start: startTime,
        end: endTime,
      });

    // Lọc theo loại xe - VIP/STANDARD/LIMOUSE
    if (busType?.length) {
      query.andWhere('v.busType IN (:...busType)', {
        busType,
      });
    }

    // lọc theo giá tiền
    if (minPrice) {
      query.andWhere('trip.price >= :minPrice', { minPrice });
    }
    if (maxPrice) {
      query.andWhere('trip.price <= :maxPrice', { maxPrice });
    }

    // sort
    switch (sortBy) {
      case SortByEnum.PRICE_ASC:
        query.orderBy('trip.price', 'ASC');
        break;
      case SortByEnum.PRICE_DESC:
        query.orderBy('trip.price', 'DESC');
        break;
      case SortByEnum.DEPARTTIME_ASC:
        query.orderBy('trip.departDate', 'ASC');
        break;
      case SortByEnum.DEPARTTIME_DESC:
        query.orderBy('trip.departDate', 'DESC');
        break;
    }

    // phân trang
    const [results, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      status: 'success',
      message: 'Tìm kiếm chuyến đi thành công!',
      pagination: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      trips: results,
    };
  }

  async createTrip(data: createTripDTO) {
    // Kiểm tra location from có tồn tại ko
    const from = await this.locationService.findLocationByNameOrId(
      data.fromLocationName,
    );
    if (!from) {
      throw new BadRequestException('Điểm đón không tồn tại trong hệ thống!!');
    }

    // Kiểm tra location to có tồn tại ko
    const to = await this.locationService.findLocationByNameOrId(
      data.toLocationName,
    );
    if (!to)
      throw new BadRequestException('Điểm đến không tồn tại trong hệ thống!!');

    // Kiểm tra from với to có giống nhau không
    if (from.name.trim().toLowerCase() === to.name.trim().toLowerCase()) {
      throw new BadRequestException(
        'Điểm đón và điểm đến không được giống nhau!!',
      );
    }

    // Kiểm tra vehicle của trip này có tồn tại không
    const vehicle = await this.vehicleService.findVehicleByIdOrCodeNumber(
      data.vehicleCodeNumber,
    );
    if (!vehicle) {
      throw new BadRequestException(
        'Phương tiện không tồn tại trong hệ thống!!',
      );
    }

    // Kiểm tra arivelTime > departTime
    if (new Date(data.arriveTime) <= new Date(data.departTime)) {
      throw new BadRequestException(
        'Thời gian đến phải lớn hơn thời gian khởi hành!!',
      );
    }

    // Kiểm tra trip này có tồn tại chưa
    const existsTrip = await this.tripRepository.findOne({
      where: {
        vehicle: { code: data.vehicleCodeNumber },
      },
      relations: ['vehicle'],
    });
    if (existsTrip) {
      throw new BadRequestException(
        `Xe ${existsTrip.vehicle.code} đã có chuyến đi vào lúc ${new Date(data.departTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} rồi!!`,
      );
    }

    // tạo trip
    const tripData = {
      price: data.price,
      departTime: data.departTime,
      arriveTime: data.arriveTime,
      availabelSeat: vehicle.totalSeat, // Số ghế có sẵn bằng tổng số ghế của phương tiện
      fromLocationName: from.name, // Lưu tên địa điểm
      toLocationName: to.name, // Lưu tên địa điểm
      codeNumber: data.vehicleCodeNumber,
      from,
      to,
      vehicle,
    };
    const trip = this.tripRepository.create(tripData);
    await this.tripRepository.save(trip);

    return trip;
  }

  private buildDepartDate(date: Date, hour: string): Date {
    return new Date(`${format(date, 'yyyy-MM-dd')}T${hour}:00`);
  }

  // generate trip theo trước 1 khaongr thời gian
  async genTrip(data: GenTripDTO) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { vehicleId: data.vehicleId },
      relations: ['route'],
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle không tồn tại');
    }
    if (!vehicle.route) {
      throw new NotFoundException('Vehicle chưa được gán tuyến đường');
    }
    if (!vehicle.departHour) {
      throw new NotFoundException('Xe chưa có giờ khởi hành cố định');
    }

    const { route, departHour, totalSeat } = vehicle;
    const { repeatsDay, duration, restAtDestination } = route;

    const startTime = data.startTime ? new Date(data.startTime) : new Date();
    const endTime = new Date(data.endTime);

    if (startTime > endTime) {
      throw new BadRequestException('Thời gian end phải lớn hơn start');
    }

    const tripsToCreate: Trip[] = [];
    const returnTripsToCreate: Trip[] = [];

    // Lấy toàn bộ trip đã tồn tại trong khoảng thời gian
    const existedTrips = await this.tripRepository.find({
      where: {
        vehicle: { vehicleId: vehicle.vehicleId },
        departDate: Between(startTime, endTime),
      },
      select: ['departDate'],
    });

    const existedDepartSet = new Set(
      existedTrips.map((t) => new Date(t.departDate).getTime()),
    );

    for (
      let current = new Date(startTime);
      current <= endTime;
      current = addDays(current, repeatsDay)
    ) {
      const departDate = this.buildDepartDate(current, departHour);

      if (existedDepartSet.has(departDate.getTime())) continue;

      // Tạo trip đi
      const trip = this.tripRepository.create({
        price: data.price,
        availabelSeat: totalSeat,
        vehicle,
        departDate,
        type: 'go',
      });

      // Tạo trip về
      const returnTrip = this.tripRepository.create({
        price: data.price,
        availabelSeat: totalSeat,
        vehicle,
        departDate: addHours(departDate, duration + restAtDestination),
        type: 'return',
      });

      tripsToCreate.push(trip);
      returnTripsToCreate.push(returnTrip);
    }

    await this.tripRepository.save([...tripsToCreate, ...returnTripsToCreate]);

    return {
      status: 'success',
      message: `${tripsToCreate.length} chuyến đã được tạo thành công`,
      trips: tripsToCreate,
      returnTrips: returnTripsToCreate,
    };
  }

  // Xóa trip: theo 1 Id, theo mảng Id, xóa trước 1 ngày nào đó, xóa sau 1 ngày nào đó, xóa trong khoảng thời gian,
  async deleteTrip(options: DeleteTripDTO) {
    const {
      afterDate,
      beforeDate,
      fromDate,
      toDate,
      tripId,
      tripIds,
      deleteAll,
    } = options;
    const query = this.tripRepository.createQueryBuilder().delete().from(Trip);

    if (deleteAll) {
      console.log('Xoas all');
    } else if (tripId) {
      query.where('tripId = :tripId', { tripId });
    } else if (tripIds && tripIds.length > 0) {
      query.where('tripId IN (:...tripIds)', { tripIds });
    } else if (beforeDate) {
      query.where('departDate < :before', {
        before: new Date(`${beforeDate}T00:00:00+07:00`),
      });
    } else if (afterDate) {
      query.where('departDate > :after', {
        after: new Date(`${afterDate}T00:00:00+07:00`),
      });
    } else if (fromDate && toDate) {
      query.where('departDate BETWEEN :from AND :to', {
        from: new Date(`${fromDate}T00:00:00+07:00`),
        to: new Date(`${toDate}T23:59:59+07:00`),
      });
    } else {
      throw new BadRequestException('Không có điều kiện xoá hợp lệ');
    }

    const result = await query.execute();
    return {
      message: `Đã xoá ${result.affected} trip`,
    };
  }

  // cancle trip
  async cancleTrip(tripId: string) {
    // logic:
    // Nếu trip return bị lỗi không đi được thì
    // Chuyển trip.status = CANCELLED
    // Kiểm tra có trip nào cùng đường không để chuyển các vé qua trip đó
    // Nếu Không có trip tương đồng thì gửi email xin lỗi và refund lại cho khách
    // Nếu Có trip tương đồng thì:
    // kiểm tra vé ghế của trip lỗi có còn trống ở trip tương đồng không, nếu có:
    // Thì thông báo email thay đổi thông tin chuyến đi
    // Nếu không thì refund lại cho khách
    // Còn nếu lỗi ở trip go thì làm tương tự nhưng ở cả 2 trip go vả return luôn
  }
}
