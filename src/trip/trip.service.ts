import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Between, Equal, ILike, MoreThanOrEqual, Repository } from 'typeorm';
import { Trip } from './trip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createTripDTO } from './dto/createTripDTO';
import { SearchTripDTO } from './dto/searchTripDTO';
import { LocationService } from 'src/location/locationService';
import { VehicleService } from 'src/vehicle/vehicle.service';
import { DateTime } from 'luxon';
import { SortByEnum } from 'src/common/enum/SortByEnum';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private locationService: LocationService,
    private vehicleService: VehicleService,
  ) {}

  async findTripByID(id: string) {
    const result = await this.tripRepository.findOne({
      where: { tripId: id },
      relations: ['from', 'to', 'vehicle'],
    });

    return result;
  }

  // Lọc trip theo from/to/time
  async searchTrip(data: SearchTripDTO) {
    const {
      fromLocationName,
      toLocationName,
      page,
      limit,
      providerName,
      vehicleSubType,
      minPrice,
      maxPrice,
      sortBy,
    } = data;
    // Kiểm tra location from có tồn tại ko
    const from =
      await this.locationService.findLocationByNameOrId(fromLocationName);
    if (!from) {
      throw new NotFoundException(
        'Địa điểm khởi hành không tồn tại trong hệ thống!!',
      );
    }

    // kiểm tra to có tồn tại ko
    const to =
      await this.locationService.findLocationByNameOrId(toLocationName);
    if (!to) {
      throw new NotFoundException(
        'Địa điểm đến không tồn tại trong hệ thống!!',
      );
    }

    // Kiểm tra có departTime không
    const departTime = data.departTime ? data.departTime : new Date();

    // kiểm tra departTime > now
    if (new Date(departTime) < new Date()) {
      throw new BadRequestException(
        'Thời gian khởi hành phải lớn hơn thời gian hiện tại!!',
      );
    }

    // Múi giờ của hệ thống backend/PostgreSQL
    const vnZone = 'Asia/Ho_Chi_Minh';

    // Chuyển departTime (string 'yyyy-MM-dd') thành khoảng ngày ở VN
    const startTimeVN = DateTime.fromISO(departTime, { zone: vnZone }).startOf(
      'day',
    );
    const endTimeVN = startTimeVN.plus({ days: 1 });

    // Convert về UTC để so sánh đúng với dữ liệu trong DB
    const startTimeUTC = startTimeVN.toUTC().toJSDate();
    const endTimeUTC = endTimeVN.toUTC().toJSDate();

    // query trips
    const query = this.tripRepository
      .createQueryBuilder('trip') // trip là alias: bí danh
      .leftJoinAndSelect('trip.vehicle', 'v')
      .leftJoinAndSelect('v.transportProvider', 'provider')
      .where('trip.fromLocationName ILIKE :from', { from: fromLocationName })
      .andWhere('trip.toLocationName ILIKE :to', { to: toLocationName })
      .andWhere('trip.departTime BETWEEN :start AND :end', {
        start: startTimeUTC,
        end: endTimeUTC,
      });

    // Lọc theo tên nhà xe
    if (providerName?.length) {
      query.andWhere('provider.name ILIKE ANY(:providerName)', {
        providerName: providerName.map((name) => `%${name}%`),
      });
    }

    // Lọc theo loại xe - VIP/STANDARD/LIMOUSE
    if (vehicleSubType?.length) {
      query.andWhere('v.subType IN (:...vehicleSubType)', {
        vehicleSubType,
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
        query.orderBy('trip.departTime', 'ASC');
        break;
      case SortByEnum.DEPARTTIME_DESC:
        query.orderBy('trip.departTime', 'DESC');
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
        departTime: Equal(data.departTime),
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
    const lastTrip = await this.tripRepository.findOne({
      where: {
        vehicle: { code: data.vehicleCodeNumber },
      },
      order: { departTime: 'DESC' },
    });
    if (lastTrip) {
      if (
        data.fromLocationName.trim().toLowerCase() !==
        lastTrip.toLocationName.trim().toLowerCase()
      ) {
        throw new BadRequestException(
          `Phương tiện ${vehicle.code} hiện đang ở ${lastTrip.toLocationName}, không thể tạo chuyến đi từ ${data.fromLocationName}!!`,
        );
      }

      // Cho tài xế nghỉ 8 tiếng trước khi bắt đầu chuyến mới
      const arriveTime = new Date(lastTrip.arriveTime);
      const minNextDepartTime = new Date(
        arriveTime.getTime() + 8 * 60 * 60 * 1000,
      ); // 8 tiếng sau
      const dtoDepartTime = new Date(data.departTime);

      if (dtoDepartTime < minNextDepartTime) {
        throw new BadRequestException(
          `Tài xế phải nghỉ ít nhất 8 giờ. Chuyến tiếp theo phải bắt đầu sau ${minNextDepartTime.toLocaleString()}.`,
        );
      }
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
}
