export type AppRole = 'client' | 'business';

export type ClientSubView = 'explore' | 'my-booking' | 'faq' | 'profile' | 'favorites';

export type BusinessSubView =
  | 'dashboard'
  | 'calendar'
  | 'services'
  | 'schedule'
  | 'professionals'
  | 'venue'
  | 'pricing'
  | 'whatsapp'
  | 'notifications'
  | 'qr-code';

export interface WhatsAppConfig {
  enabled: boolean;
  businessPhone: string;
  autoOpenChat: boolean;
  confirmationTemplate: string;
  reminder24hTemplate: string;
}

export interface SmsConfig {
  enabled: boolean;
  gatewayProvider: 'twilio' | 'aws_sns' | 'simulated';
  apiKey: string;
  senderHeader: string;
  reminder2hEnabled: boolean;
  reminder24hEnabled: boolean;
  smsTemplate: string;
}

export interface Review {
  id: string;
  venueId: string;
  appointmentId?: string;
  clientName: string;
  rating: number; // 1..5
  comment: string;
  date: string;
  serviceName?: string;
}

export type ServiceCategory =
  | 'belleza'
  | 'bienestar'
  | 'deportes'
  | 'lugares'
  | 'vehiculos'
  | 'restaurantes';

export type DayName =
  | 'Lunes'
  | 'Martes'
  | 'Miércoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sábado'
  | 'Domingo';

export type SpecialistStatus = 'Disponible' | 'En Servicio' | 'Descanso';

export type SaasPlanId = 'basico' | 'pro' | 'elite';

export interface Venue {
  id: string;
  name: string;
  category: ServiceCategory;
  categoryLabel: string;
  subCategory?: string;
  rating: number;
  location: string;
  priceLevel: string;
  image: string;
  glbUrl?: string;
  photos?: string[];
  description?: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface ServiceItem {
  id: string;
  category: ServiceCategory;
  subCategory?: string;
  name: string;
  duration: string;
  price: number;
  desc: string;
  isActive: boolean;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  rating: string;
  exp: string;
  status: SpecialistStatus;
  avatar: string;
}

export interface WorkingDayConfig {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface BlockedSlot {
  id: string;
  day: DayName;
  startTime: string;
  endTime: string;
  proId: string; // 'all' or specific professional id
  proName: string;
  reason: string;
}

export type BookingEngineType = 
  | 'appointment'   // Standard pro-based: Barber, Medical, etc.
  | 'accommodation' // Date range based: Fincas, Hotels.
  | 'facility'      // Space/Hour based: Canchas, Studios.
  | 'sports'        // Class/Activity based: Gym, Yoga.
  | 'rental'        // Vehicle rental based.
  | 'restaurant';   // Table/Order based.

export interface Appointment {
  id: string;
  code: string;
  venueName: string;
  client: string;
  phone: string;
  email?: string;
  notes?: string;
  serviceId: string;
  service: string;
  proId: string;
  pro: string;
  dateKey: string; // Used for starting date or single date
  dayName: DayName;
  time: string;
  price: number;
  status: 'Confirmada' | 'Completada' | 'Cancelada';
  
  // Multicategory Specialized Fields
  engineType?: BookingEngineType;
  subCategory?: string;
  
  // Accommodation (Fincas, Hotels)
  checkInDate?: string;
  checkOutDate?: string;
  guestsCount?: number;
  guestsBreakdown?: { adults: number; children: number; pets: number };
  
  // Facility / Sports (Canchas, Studios)
  durationHours?: number;
  resourceId?: string; // Specific Court or Room ID
  
  // Sports / Gym
  activityType?: string;
  modality?: 'pase' | 'membresia' | 'clase';
  
  // Rental (Vehicles)
  pickupTime?: string;
  returnTime?: string;
  pickupLocation?: string;
  returnLocation?: string;
  vehicleDetails?: { brand: string; model: string; year?: string; plate?: string };
  
  // Restaurant
  zone?: string;
  
  // Common extras
  amenities?: string[];
  isRecurring?: boolean;
  responsibleName?: string;
  responsiblePhone?: string;
}

export interface UpcomingDateOption {
  dateKey: string;
  shortDay: string;
  shortDate: string;
  dayName: DayName;
}

