import { db } from './index.ts';
import {
  appointments,
  blockedSlots,
  professionals,
  services,
  venues,
  whatsappConfigs,
} from './schema.ts';

export async function seedDatabaseIfEmpty() {
  try {
    const existingServices = await db.select().from(services).limit(1);
    if (existingServices.length > 0) {
      return; // Already seeded
    }

    // Seed Venues
    await db.insert(venues).values([
      {
        id: 'v1',
        name: 'The Barber Club Flagship',
        category: 'barberia',
        address: 'Zona Rosa',
        phone: '+57 312 456 7890',
        rating: '4.9',
        priceLevel: '$$',
      },
      {
        id: 'v2',
        name: 'Sérénité Spa & Masajes',
        category: 'spa',
        address: 'El Poblado',
        phone: '+57 315 889 0123',
        rating: '5.0',
        priceLevel: '$$$',
      },
      {
        id: 'v3',
        name: 'Atelier Haute Coiffure',
        category: 'peluqueria',
        address: 'Chapinero Alto',
        phone: '+57 301 234 5678',
        rating: '4.8',
        priceLevel: '$$$',
      },
    ]).onConflictDoNothing();

    // Seed Services
    await db.insert(services).values([
      {
        id: 's1',
        category: 'barberia',
        name: 'Corte Fade Pro & Asesoría',
        duration: '45 min',
        price: 35000,
        desc: 'Degradado con navaja, perfilado y peinado',
        isActive: true,
      },
      {
        id: 's2',
        category: 'barberia',
        name: 'Ritual Barba con Toalla al Vapor',
        duration: '30 min',
        price: 28000,
        desc: 'Afeitado tradicional y aceites botánicos',
        isActive: true,
      },
      {
        id: 's3',
        category: 'barberia',
        name: 'Combo Completo Corte + Barba',
        duration: '60 min',
        price: 55000,
        desc: 'Servicio insignia con mascarilla refrescante',
        isActive: true,
      },
      {
        id: 's4',
        category: 'spa',
        name: 'Masaje Relajante Piedras Volcánicas',
        duration: '60 min',
        price: 85000,
        desc: 'Termoterapia descontracturante y relajante',
        isActive: true,
      },
      {
        id: 's5',
        category: 'spa',
        name: 'Limpieza Facial Profunda Glow',
        duration: '45 min',
        price: 65000,
        desc: 'Exfoliación orgánica y mascarilla de colágeno',
        isActive: true,
      },
    ]).onConflictDoNothing();

    // Seed Professionals
    await db.insert(professionals).values([
      {
        id: 'p1',
        name: 'Mateo Silva',
        role: 'Master Barber & Estilista',
        rating: '4.9',
        reviews: 128,
        status: 'Disponible',
      },
      {
        id: 'p2',
        name: 'Laura Restrepo',
        role: 'Terapeuta Holística & Masajista',
        rating: '5.0',
        reviews: 94,
        status: 'Disponible',
      },
      {
        id: 'p3',
        name: 'Dra. Sofía Meza',
        role: 'Médico Estético & Cosmiatra',
        rating: '4.9',
        reviews: 156,
        status: 'Disponible',
      },
      {
        id: 'p4',
        name: 'Valentina Rios',
        role: 'Colorista Senior & Visagista',
        rating: '4.8',
        reviews: 82,
        status: 'Disponible',
      },
    ]).onConflictDoNothing();

    // Seed Initial Appointments
    await db.insert(appointments).values([
      {
        id: 'apt_1',
        code: 'GLW-4091',
        venueName: 'The Barber Club Flagship',
        client: 'Carlos Mendoza',
        phone: '+57 312 456 7890',
        email: 'carlos.mendoza@gmail.com',
        serviceId: 's1',
        service: 'Corte Fade Pro & Asesoría',
        proId: 'p1',
        pro: 'Mateo Silva',
        dateKey: 'Mar, 10 Nov',
        dayName: 'Martes',
        time: '09:00 AM',
        price: 35000,
        status: 'Confirmada',
      },
      {
        id: 'apt_2',
        code: 'GLW-4092',
        venueName: 'Sérénité Spa & Masajes',
        client: 'Camila Ortiz',
        phone: '+57 315 889 0123',
        serviceId: 's4',
        service: 'Masaje Relajante Piedras Volcánicas',
        proId: 'p2',
        pro: 'Laura Restrepo',
        dateKey: 'Vie, 06 Nov',
        dayName: 'Viernes',
        time: '09:00 AM',
        price: 85000,
        status: 'Confirmada',
      },
    ]).onConflictDoNothing();

    // Seed Initial Blocked Slots
    await db.insert(blockedSlots).values([
      {
        id: 'blk_1',
        day: 'Martes',
        startTime: '04:00 PM',
        endTime: '06:00 PM',
        proId: 'all',
        proName: 'Todo el Establecimiento',
        reason: 'Capacitación y descanso del equipo',
      },
    ]).onConflictDoNothing();

    // Seed WhatsApp Config
    await db.insert(whatsappConfigs).values({
      id: 'default',
      enabled: true,
      businessPhone: '+57 312 456 7890',
      autoOpenChat: true,
      confirmationTemplate: `✨ *¡Hola {{cliente_nombre}}! Tu reserva en {{establecimiento}} está confirmada* ✨

📋 *Resumen de tu Cita:*
• *Código:* #{{codigo}}
• *Servicio:* {{servicio}}
• *Especialista:* {{profesional}}
• *Fecha:* {{fecha}}
• *Hora:* {{hora}}
• *Total a pagar:* {{precio}}

🔗 *Enlace de confirmación:*
{{enlace_confirmacion}}

📍 *Recomendación:* Por favor llega 5 a 10 minutos antes.
Si tienes dudas o deseas reprogramar, escríbenos directamente a este chat.

¡Será un gusto atenderte! 💈✨`,
      reminder24hTemplate: `⏰ *Recordatorio de Cita en {{establecimiento}}*

Hola *{{cliente_nombre}}*, te recordamos tu cita programada:
• *Servicio:* {{servicio}} con *{{profesional}}*
• *Fecha y Hora:* {{fecha}} a las {{hora}}
• *Código:* #{{codigo}}

🔗 *Detalle y Confirmación:*
{{enlace_confirmacion}}

Por favor confírmanos respondiendo con un *SÍ* a este mensaje. ¡Te esperamos!`,
    }).onConflictDoNothing();

    console.log('Database seeded successfully in Cloud SQL PostgreSQL.');
  } catch (error) {
    console.error('Error seeding initial data in Cloud SQL:', error);
  }
}
