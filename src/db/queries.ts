import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  appointments,
  blockedSlots,
  professionals,
  services,
  venues,
  whatsappConfigs,
} from './schema.ts';
import type {
  Appointment,
  BlockedSlot,
  Professional,
  ServiceItem,
  Venue,
  WhatsAppConfig,
} from '../types.ts';

// 1. Venues
export async function getDbVenues(): Promise<Venue[]> {
  try {
    const rows = await db.select().from(venues);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category as any,
      categoryLabel:
        r.category === 'barberia'
          ? 'Barbería Premium'
          : r.category === 'spa'
          ? 'Spa & Masajes'
          : r.category === 'deportes'
          ? 'Deportes & Canchas'
          : r.category === 'bienestar'
          ? 'Bienestar & Salud'
          : r.category === 'restaurantes'
          ? 'Restaurante & Gastronomía'
          : 'Peluquería & Estética',
      subCategory: r.category,
      rating: parseFloat(r.rating || '4.9'),
      location: r.address || 'Bogotá / Medellín',
      priceLevel: r.priceLevel || '$$',
      image: r.image || '',
      glbUrl: r.glbUrl || undefined,
      phone: r.phone || undefined,
      address: r.address || undefined,
    }));
  } catch (error) {
    console.error('Failed to get venues from Cloud SQL:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function upsertDbVenue(venue: Partial<Venue> & { id: string; name: string; category: string }): Promise<Venue> {
  try {
    const result = await db
      .insert(venues)
      .values({
        id: venue.id,
        name: venue.name,
        category: venue.category,
        address: venue.address || venue.location || 'Bogotá / Medellín',
        phone: venue.phone || '+57 300 000 0000',
        rating: String(venue.rating || 4.9),
        priceLevel: venue.priceLevel || '$$',
        image: venue.image || '',
        glbUrl: venue.glbUrl || null,
      })
      .onConflictDoUpdate({
        target: venues.id,
        set: {
          name: venue.name,
          category: venue.category,
          address: venue.address || venue.location || 'Bogotá / Medellín',
          phone: venue.phone || '+57 300 000 0000',
          image: venue.image || '',
          glbUrl: venue.glbUrl || null,
        },
      })
      .returning();

    const r = result[0];
    return {
      id: r.id,
      name: r.name,
      category: r.category as any,
      categoryLabel: r.category,
      subCategory: r.category,
      rating: parseFloat(r.rating || '4.9'),
      location: r.address || 'Bogotá / Medellín',
      priceLevel: r.priceLevel || '$$',
      image: r.image || '',
      glbUrl: r.glbUrl || undefined,
      phone: r.phone || undefined,
      address: r.address || undefined,
    };
  } catch (error) {
    console.error('Failed to upsert venue in Cloud SQL:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

// 2. Services
export async function getDbServices(): Promise<ServiceItem[]> {
  try {
    const rows = await db.select().from(services);
    return rows.map((r) => ({
      id: r.id,
      category: r.category as any,
      name: r.name,
      duration: r.duration,
      price: r.price,
      desc: r.desc || '',
      isActive: r.isActive,
    }));
  } catch (error) {
    console.error('Failed to get services from Cloud SQL:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function upsertDbService(item: ServiceItem): Promise<ServiceItem> {
  try {
    const result = await db
      .insert(services)
      .values({
        id: item.id,
        category: item.category,
        name: item.name,
        duration: item.duration,
        price: item.price,
        desc: item.desc || null,
        isActive: item.isActive,
      })
      .onConflictDoUpdate({
        target: services.id,
        set: {
          category: item.category,
          name: item.name,
          duration: item.duration,
          price: item.price,
          desc: item.desc || null,
          isActive: item.isActive,
        },
      })
      .returning();

    const r = result[0];
    return {
      id: r.id,
      category: r.category as any,
      name: r.name,
      duration: r.duration,
      price: r.price,
      desc: r.desc || '',
      isActive: r.isActive,
    };
  } catch (error) {
    console.error('Failed to upsert service in Cloud SQL:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

export async function deleteDbService(id: string): Promise<boolean> {
  try {
    await db.delete(services).where(eq(services.id, id));
    return true;
  } catch (error) {
    console.error('Failed to delete service in Cloud SQL:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

// 3. Professionals
export async function getDbProfessionals(): Promise<Professional[]> {
  try {
    const rows = await db.select().from(professionals);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      avatar: r.avatar || '',
      rating: r.rating || '4.9',
      exp: '4+ años',
      status: r.status as any,
    }));
  } catch (error) {
    console.error('Failed to get professionals from Cloud SQL:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function upsertDbProfessional(pro: Professional): Promise<Professional> {
  try {
    const result = await db
      .insert(professionals)
      .values({
        id: pro.id,
        name: pro.name,
        role: pro.role,
        avatar: pro.avatar || null,
        rating: pro.rating || '4.9',
        reviews: 0,
        status: pro.status,
      })
      .onConflictDoUpdate({
        target: professionals.id,
        set: {
          name: pro.name,
          role: pro.role,
          avatar: pro.avatar || null,
          rating: pro.rating || '4.9',
          status: pro.status,
        },
      })
      .returning();

    const r = result[0];
    return {
      id: r.id,
      name: r.name,
      role: r.role,
      avatar: r.avatar || '',
      rating: r.rating || '4.9',
      exp: pro.exp || '4+ años',
      status: r.status as any,
    };
  } catch (error) {
    console.error('Failed to upsert professional in Cloud SQL:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

export async function deleteDbProfessional(id: string): Promise<boolean> {
  try {
    await db.delete(professionals).where(eq(professionals.id, id));
    return true;
  } catch (error) {
    console.error('Failed to delete professional in Cloud SQL:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

// 4. Appointments
export async function getDbAppointments(): Promise<Appointment[]> {
  try {
    const rows = await db.select().from(appointments);
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      venueId: r.venueId,
      venueName: r.venueName,
      client: r.client,
      phone: r.phone,
      email: r.email || undefined,
      notes: r.notes || undefined,
      serviceId: r.serviceId || 's1',
      service: r.service,
      proId: r.proId || 'p1',
      pro: r.pro,
      dateKey: r.dateKey,
      dayName: r.dayName as any,
      time: r.time,
      price: r.price,
      status: r.status as any,
      consentWhatsApp: r.consentWhatsApp || false,
      reminderSent: r.reminderSent || false,
    }));
  } catch (error) {
    console.error('Failed to get appointments from Cloud SQL:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function createDbAppointment(appt: Appointment): Promise<Appointment> {
  try {
    const result = await db
      .insert(appointments)
      .values({
        id: appt.id,
        code: appt.code,
        venueId: appt.venueId,
        venueName: appt.venueName,
        client: appt.client,
        phone: appt.phone,
        email: appt.email || null,
        notes: appt.notes || null,
        serviceId: appt.serviceId || null,
        service: appt.service,
        proId: appt.proId || null,
        pro: appt.pro,
        dateKey: appt.dateKey,
        dayName: appt.dayName,
        time: appt.time,
        price: appt.price,
        status: appt.status,
        consentWhatsApp: appt.consentWhatsApp || false,
        reminderSent: appt.reminderSent || false,
      })
      .returning();

    const r = result[0];
    return {
      id: r.id,
      code: r.code,
      venueId: r.venueId,
      venueName: r.venueName,
      client: r.client,
      phone: r.phone,
      email: r.email || undefined,
      notes: r.notes || undefined,
      serviceId: r.serviceId || appt.serviceId,
      service: r.service,
      proId: r.proId || appt.proId,
      pro: r.pro,
      dateKey: r.dateKey,
      dayName: r.dayName as any,
      time: r.time,
      price: r.price,
      status: r.status as any,
      consentWhatsApp: r.consentWhatsApp || false,
      reminderSent: r.reminderSent || false,
    };
  } catch (error) {
    console.error('Failed to create appointment in Cloud SQL:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

// 5. Blocked Slots
export async function getDbBlockedSlots(): Promise<BlockedSlot[]> {
  try {
    const rows = await db.select().from(blockedSlots);
    return rows.map((r) => ({
      id: r.id,
      day: r.day as any,
      startTime: r.startTime,
      endTime: r.endTime,
      proId: r.proId,
      proName: r.proName,
      reason: r.reason,
    }));
  } catch (error) {
    console.error('Failed to get blocked slots from Cloud SQL:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function createDbBlockedSlot(slot: BlockedSlot): Promise<BlockedSlot> {
  try {
    const result = await db
      .insert(blockedSlots)
      .values({
        id: slot.id,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        proId: slot.proId,
        proName: slot.proName,
        reason: slot.reason,
      })
      .returning();

    const r = result[0];
    return {
      id: r.id,
      day: r.day as any,
      startTime: r.startTime,
      endTime: r.endTime,
      proId: r.proId,
      proName: r.proName,
      reason: r.reason,
    };
  } catch (error) {
    console.error('Failed to create blocked slot in Cloud SQL:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

export async function deleteDbBlockedSlot(id: string): Promise<boolean> {
  try {
    await db.delete(blockedSlots).where(eq(blockedSlots.id, id));
    return true;
  } catch (error) {
    console.error('Failed to delete blocked slot in Cloud SQL:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

// 6. WhatsApp Configuration
export async function getDbWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  try {
    const rows = await db.select().from(whatsappConfigs).limit(1);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      enabled: r.enabled,
      businessPhone: r.businessPhone,
      autoOpenChat: r.autoOpenChat,
      confirmationTemplate: r.confirmationTemplate,
      reminder24hTemplate: r.reminder24hTemplate,
    };
  } catch (error) {
    console.error('Failed to get WhatsApp config from Cloud SQL:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function saveDbWhatsAppConfig(config: WhatsAppConfig): Promise<WhatsAppConfig> {
  try {
    const result = await db
      .insert(whatsappConfigs)
      .values({
        id: 'default',
        enabled: config.enabled,
        businessPhone: config.businessPhone,
        autoOpenChat: config.autoOpenChat,
        confirmationTemplate: config.confirmationTemplate,
        reminder24hTemplate: config.reminder24hTemplate,
      })
      .onConflictDoUpdate({
        target: whatsappConfigs.id,
        set: {
          enabled: config.enabled,
          businessPhone: config.businessPhone,
          autoOpenChat: config.autoOpenChat,
          confirmationTemplate: config.confirmationTemplate,
          reminder24hTemplate: config.reminder24hTemplate,
          updatedAt: new Date(),
        },
      })
      .returning();

    const r = result[0];
    return {
      enabled: r.enabled,
      businessPhone: r.businessPhone,
      autoOpenChat: r.autoOpenChat,
      confirmationTemplate: r.confirmationTemplate,
      reminder24hTemplate: r.reminder24hTemplate,
    };
  } catch (error) {
    console.error('Failed to save WhatsApp config to Cloud SQL:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}
