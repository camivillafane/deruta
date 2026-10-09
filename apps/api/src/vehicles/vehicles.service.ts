import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../entities/index.js';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto.js';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(userId: string, dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create({ ...dto, userId });
    return this.vehicleRepository.save(vehicle);
  }

  async findByUser(userId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id, userId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    return vehicle;
  }

  async update(id: string, userId: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id, userId);
    Object.assign(vehicle, dto);
    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: string, userId: string): Promise<void> {
    const vehicle = await this.findOne(id, userId);
    vehicle.isActive = false;
    await this.vehicleRepository.save(vehicle);
  }
}
