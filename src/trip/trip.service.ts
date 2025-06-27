import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Between, Equal, ILike, MoreThanOrEqual, Repository } from 'typeorm';
import { Trip } from './trip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createTripDTO } from './dto/createTripDTO';
import { Location } from 'src/location/location.entity';
import { Vehicle } from 'src/vehicle/vehicle.entity';
import { Seat } from 'src/seat/seat.entity';
import { SearchTripDTO } from './dto/searchTripDTO';
import { LocationService } from 'src/location/locationService';
import { VehicleService } from 'src/vehicle/vehicle.service';

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
    const { fromLocationName, toLocationName } = data;
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

    // Kiểm tra có startTime không
    const startTime = data.startTime ? data.startTime : new Date();

    // kiểm tra startTime > now
    if (new Date(startTime) < new Date()) {
      throw new BadRequestException(
        'Thời gian khởi hành phải lớn hơn thời gian hiện tại!!',
      );
    }

    // Xử lý thời gian khởi hành
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(startTime);
    endTimeDate.setDate(endTimeDate.getDate() + 1);
    // ==> bởi vì startTime là ngày thôi ko có giờ mà trip thì sẽ có hour nên ta sẽ lấy tất cả các chuyến đi trong ngày đó

    // Tìm kiếm trip theo from/to/time
    const trips = await this.tripRepository.find({
      where: {
        fromLocationName: ILike(fromLocationName),
        toLocationName: ILike(toLocationName),
        departTime: Between(startTimeDate, endTimeDate),
      },
    });

    if (trips.length === 0) {
      return {
        status: 'success',
        message: 'Không tìm thấy chuyến đi nào phù hợp với yêu cầu của bạn!!',
        trips: [],
      };
    }

    return {
      status: 'success',
      message: 'Tìm kiếm chuyến đi thành công!!',
      trips,
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
