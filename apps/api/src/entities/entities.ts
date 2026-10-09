import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: 'user' | 'admin';

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true, type: 'varchar', select: false })
  emailVerificationCode?: string;

  @Column({ nullable: true, type: 'datetime' })
  emailVerificationExpiresAt?: Date;

  @Column({ default: false })
  phoneVerified: boolean;

  @Column({ nullable: true, type: 'varchar', select: false })
  phoneVerificationCode?: string;

  @Column({ nullable: true, type: 'datetime' })
  phoneVerificationExpiresAt?: Date;

  @Column({ nullable: true })
  dni?: string;

  @Column({ nullable: true })
  licenseNumber?: string;

  @Column({ nullable: true })
  licenseFrontImage?: string;

  @Column({ nullable: true })
  licenseBackImage?: string;

  @Column({ default: false })
  identityVerified: boolean;

  @Column({ nullable: true, type: 'datetime' })
  identitySubmittedAt?: Date;

  @Column({ nullable: true, type: 'datetime' })
  identityVerifiedAt?: Date;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalTrips: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true, type: 'varchar', select: false })
  refreshTokenHash?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.user)
  vehicles: Vehicle[];

  @OneToMany(() => Trip, (trip) => trip.driver)
  trips: Trip[];

  @OneToMany(() => TripRequest, (request) => request.passenger)
  tripRequests: TripRequest[];

  @OneToMany(() => TripSearch, (search) => search.user)
  tripSearches: TripSearch[];

  @OneToMany(() => Rating, (rating) => rating.reviewer)
  ratingsGiven: Rating[];

  @OneToMany(() => Rating, (rating) => rating.reviewedUser)
  ratingsReceived: Rating[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(() => Alert, (alert) => alert.user)
  alerts: Alert[];
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.vehicles, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column({ nullable: true })
  year: number;

  @Column()
  color: string;

  @Column({ nullable: true })
  plate: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum TripStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.trips, { onDelete: 'CASCADE' })
  driver: User;

  @Column()
  driverId: string;

  @Column()
  origin: string;

  @Column()
  destination: string;

  @Column({ type: 'date' })
  departureDate: Date;

  @Column({ type: 'time' })
  departureTime: string;

  @Column({ nullable: true })
  meetingPoint: string;

  @Column({ type: 'int' })
  availableSeats: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  contributionPerPassenger: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 20, default: TripStatus.ACTIVE })
  status: TripStatus;

  @ManyToOne(() => Vehicle, { onDelete: 'SET NULL' })
  vehicle: Vehicle;

  @Column({ nullable: true })
  vehicleId: string;

  @OneToMany(() => TripRequest, (request) => request.trip)
  requests: TripRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum TripRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('trip_requests')
export class TripRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  trip: Trip;

  @Column()
  tripId: string;

  @ManyToOne(() => User, (user) => user.tripRequests, { onDelete: 'CASCADE' })
  passenger: User;

  @Column()
  passengerId: string;

  @Column({ type: 'int', default: 1 })
  seats: number;

  @Column({ type: 'varchar', length: 20, default: TripRequestStatus.PENDING })
  status: TripRequestStatus;

  @Column({ type: 'text', nullable: true })
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('trip_searches')
export class TripSearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.tripSearches, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column()
  origin: string;

  @Column()
  destination: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time', nullable: true })
  preferredTime: string;

  @Column({ default: false })
  flexibleTime: boolean;

  @Column({ type: 'int', default: 1 })
  passengers: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  trip: Trip;

  @Column()
  tripId: string;

  @ManyToOne(() => User, (user) => user.ratingsGiven, { onDelete: 'CASCADE' })
  reviewer: User;

  @Column()
  reviewerId: string;

  @ManyToOne(() => User, (user) => user.ratingsReceived, { onDelete: 'CASCADE' })
  reviewedUser: User;

  @Column()
  reviewedUserId: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  trip: Trip;

  @Column()
  tripId: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @Column()
  conversationId: string;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  sender: User;

  @Column()
  senderId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.alerts, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column()
  origin: string;

  @Column()
  destination: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time', nullable: true })
  preferredTime: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  read: boolean;

  @Column({ nullable: true })
  link: string;

  @CreateDateColumn()
  createdAt: Date;
}
