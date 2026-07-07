
export enum VehicleType {
  MINI = 'Mini',
  SEDAN = 'Sedan',
  SUV = 'SUV',
  SUV_PLUS = 'SUV+',
  INNOVA = 'Innova',
  LUXURY = 'Luxury',
  TEMPO_TRAVELLER = 'Tempo Traveller',
  TOURIST_BUS = 'Tourist Bus',
  CUSTOM = 'Custom'
}

export enum TripType {
  LOCAL = 'Local',
  ONE_WAY = 'One Way',
  ROUND_TRIP = 'Round Trip',
  RENTAL = 'Rental'
}

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  capacity: number;
  luggage: number;
  pricePerHour: number;
  image: string;
  features: string[];
  available: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  image?: string;
}

export interface FareBreakdown {
  distanceFare: number;
  driverBeta: number;
  extraDaysFare: number;
  waitingCharge?: number;
  hillCharge?: number;
  baseFare: number;
  total: number;
  ratePerKm?: number;
  billableDistance?: number;
  extraCharges?: number;
}

export interface BookingDetails {
  email?: string;
  phone: string;
  pickup: string;
  drop: string;
  date?: string;
  time?: string;
  numberOfDays?: string;
  waitingHours?: string;
  vehicleType: VehicleType;
  tripType: TripType;
  localPackage?: string;
  isHillStation?: boolean;
  distance?: string;
  rawDistance?: number;
  estimatedFare?: string;
  fareBreakdown?: FareBreakdown;
  leadId?: string;
  isLead?: boolean;
}

export interface BillRequestDetails {
  name: string;
  phone: string;
  date?: string;
  pickup: string;
  drop: string;
  amount: string;
  vehicleNumber?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  comment: string;
  rating: number;
}
