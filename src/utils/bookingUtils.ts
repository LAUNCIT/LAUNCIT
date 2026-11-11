import { BookingEngineType } from '../types';

export const getBookingEngineType = (subCategory?: string): BookingEngineType => {
  if (!subCategory) return 'appointment';
  
  const sc = subCategory.toLowerCase();
  
  // Standard Appointment (Pro + Time)
  if ([
    'barbería', 'peluquería', 'spa', 'uñas', 
    'odontología', 'psicología', 'nutrición', 'fisioterapia', 'medicina',
    'taller', 'lavado'
  ].includes(sc)) {
    return 'appointment';
  }
  
  // Accommodation (Nights + Guests)
  if ([
    'fincas', 'airbnb', 'hoteles', 'cabañas'
  ].includes(sc)) {
    return 'accommodation';
  }
  
  // Facility (Space + Hours)
  if ([
    'canchas', 'estudios', 'salones', 'auditorios', 'piscinas'
  ].includes(sc)) {
    return 'facility';
  }
  
  // Sports (Activity + Modalidad)
  if ([
    'gimnasio', 'entrenamiento', 'clases'
  ].includes(sc)) {
    return 'sports';
  }
  
  // Rental (Vehicle + Days)
  if ([
    'alquiler'
  ].includes(sc)) {
    return 'rental';
  }
  
  // Restaurant (Table + Zone)
  if ([
    'gourmet', 'rápida', 'café'
  ].includes(sc)) {
    return 'restaurant';
  }
  
  return 'appointment';
};
