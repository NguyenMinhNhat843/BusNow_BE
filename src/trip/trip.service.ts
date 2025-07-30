import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Between,
  Brackets,
  Equal,
  ILike,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Trip } from './trip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createTripDTO } from './dto/createTripDTO';
import { SearchTripDTO } from './dto/searchTripDTO';
import { LocationService } from 'src/location/locationService';
import { VehicleService } from 'src/vehicle/vehicle.service';
import { DateTime } from 'luxon';
import { SortByEnum } from 'src/common/enum/SortByEnum';
import { GenTripDTO } from './dto/genTripDTO';
import { Vehicle } from 'src/vehicle/vehicle.entity';
import { addDays, addHours, addMinutes, format } from 'date-fns';
import { Route } from 'src/route/route.entity';
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
      relations: ['vehicle'], // nếu muốn include luôn vehicle info
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
      trips,
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
    const from =
      await this.locationService.findLocationByNameOrId(fromLocationId);
    if (!from) {
      throw new NotFoundException(
        'Địa điểm khởi hành không tồn tại trong hệ thống!!',
      );
    }

    // kiểm tra to có tồn tại ko
    const to = await this.locationService.findLocationByNameOrId(toLocationId);
    if (!to) {
      throw new NotFoundException(
        'Địa điểm đến không tồn tại trong hệ thống!!',
      );
    }

    // Vì trong pg đang là giờ UTC nên sẽ lấy giwof UTC só sánh
    const startTime = new Date(departTime);
    const endTime = new Date(departTime);
    endTime.setHours(23, 59, 59, 99);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // kiểm tra departTime > now
    if (startTime < now) {
      throw new BadRequestException(
        'Thời gian khởi hành phải lớn hơn thời gian hiện tại!!',
      );
    }

    // query trips
    const query = this.tripRepository
      .createQueryBuilder('trip') // trip là alias: bí danh
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

    // const [sql, params] = query.getQueryAndParameters();
    // console.log('Query:', sql);
    // console.log('Params:', params);

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

    // Kiểm tra địa điểm hiện tại của xe có đúng là điểm khởi hành không
    // Kiểm tra thời gian khởi hành phải >= ariveTime của chuyến đi trước đó
    // const lastTrip = await this.tripRepository.findOne({
    //   where: {
    //     vehicle: { code: data.vehicleCodeNumber },
    //   },
    // });
    // if (lastTrip) {
    //   if (
    //     data.fromLocationName.trim().toLowerCase() !==
    //     lastTrip.toLocationName.trim().toLowerCase()
    //   ) {
    //     throw new BadRequestException(
    //       `Phương tiện ${vehicle.code} hiện đang ở ${lastTrip.toLocationName}, không thể tạo chuyến đi từ ${data.fromLocationName}!!`,
    //     );
    //   }

    //   // Cho tài xế nghỉ 8 tiếng trước khi bắt đầu chuyến mới
    //   const minNextDepartTime = new Date(
    //     arriveTime.getTime() + 8 * 60 * 60 * 1000,
    //   ); // 8 tiếng sau
    //   const dtoDepartTime = new Date(data.departTime);

    //   if (dtoDepartTime < minNextDepartTime) {
    //     throw new BadRequestException(
    //       `Tài xế phải nghỉ ít nhất 8 giờ. Chuyến tiếp theo phải bắt đầu sau ${minNextDepartTime.toLocaleString()}.`,
    //     );
    //   }
    // }

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

  // generate trip theo trước 1 khaongr thời gian
  async genTrip(data: GenTripDTO) {
    // kiểm tra vehicleId có tồn tại không
    const vehicle = await this.vehicleRepository.findOne({
      where: {
        vehicleId: data.vehicleId,
      },
      relations: ['route', 'route.origin', 'route.destination'],
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle không tồn tại');
    }

    // Kiểm tra vehicle được gán route vào chưa
    if (!vehicle.route) {
      throw new NotFoundException('Vehicle này chưa được gán tuyến đường');
    }

    //Kiểm tra vehicle đã cso departHour cố định chưa
    if (!vehicle.departHour) {
      throw new NotFoundException('Xe chưa gán giờ khởi hành cố định');
    }

    // Lấy repeatsDay ra để tính toán lên lịch
    const { repeatsDay } = vehicle.route;
    const createdTrips: Trip[] = [];
    const returnTrips: Trip[] = [];

    // Lấy ngày hiện tại làm gốc
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    if (startTime > endTime) {
      throw new BadRequestException('THời gian end phải lớn hơn start');
    }

    for (
      let curent = new Date(startTime);
      curent <= endTime;
      curent = addDays(curent, repeatsDay)
    ) {
      // Gộp ngày (ở trên) với giờ (cố định trong vehicle)
      const fullDepartDate = new Date(
        `${format(curent, 'yyyy-MM-dd')}T${vehicle.departHour}:00`,
      );
      // console.log(
      //   '[tripService] - [gen trip] - fullDepartDate: ',
      //   fullDepartDate,
      // );

      // 🔍 Kiểm tra nếu trip đã tồn tại (theo vehicle và departDate)
      const existed = await this.tripRepository.findOne({
        where: {
          vehicle: { vehicleId: vehicle.vehicleId },
          departDate: fullDepartDate,
        },
      });

      if (existed) continue; // bỏ qua nếu đã tồn tại

      // Taoj trip
      const trip = this.tripRepository.create({
        price: data.price,
        availabelSeat: vehicle.totalSeat,
        vehicle,
        departDate: fullDepartDate.toISOString(),
      });
      createdTrips.push(trip);

      // ============== Tạo tiếp trip chiều về ===================
      // CHuyến về vẫn sẽ dùng route đó nhưng khác departDate - giwof khởi hành thôi
      const restAtDestination = vehicle.route.restAtDestination;
      const duration = vehicle.route.duration;
      // = deprtDate của trip + duration + rest
      const returnDepartDate = addHours(
        fullDepartDate,
        duration + restAtDestination,
      );

      const returnTrip = this.tripRepository.create({
        price: data.price,
        availabelSeat: vehicle.totalSeat,
        vehicle,
        departDate: returnDepartDate.toISOString(),
        type: 'return',
      });
      returnTrips.push(returnTrip);
    }

    await this.tripRepository.save(createdTrips);
    await this.tripRepository.save(returnTrips);

    return {
      status: 'success',
      message: `${createdTrips.length} chuyến đã được tạo thành công`,
      trips: createdTrips,
      returnTrips: returnTrips,
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
