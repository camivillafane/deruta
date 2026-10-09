export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'user' | 'admin';
  identityVerified: boolean;
  identitySubmittedAt?: string;
  dni?: string;
  licenseNumber?: string;
  licenseFrontImage?: string;
  licenseBackImage?: string;
  rating: number;
  totalTrips: number;
  city?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year?: number;
  color: string;
  plate?: string;
}

export interface Trip {
  id: string;
  driverId: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  meetingPoint?: string;
  availableSeats: number;
  contributionPerPassenger: number;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  driver: User;
  vehicle?: Vehicle;
  requests?: TripRequest[];
  createdAt: string;
}

export interface TripRequest {
  id: string;
  tripId: string;
  passengerId: string;
  seats: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  trip?: Trip;
  passenger?: User;
  createdAt: string;
}

export interface TripSearch {
  id: string;
  origin: string;
  destination: string;
  date: string;
  preferredTime?: string;
  flexibleTime: boolean;
  passengers: number;
  notes?: string;
}

export interface Rating {
  id: string;
  tripId: string;
  reviewerId: string;
  reviewedUserId: string;
  score: number;
  comment?: string;
  reviewer?: User;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tripId: string;
  trip: Trip;
  messages?: Message[];
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string;
  readAt?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  origin: string;
  destination: string;
  date: string;
  preferredTime?: string;
  active: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  emailVerificationCode?: string;
  phoneVerificationCode?: string;
}
