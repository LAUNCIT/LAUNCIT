import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('partner').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Venues / Establishments
export const venues = pgTable('venues', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  address: text('address'),
  phone: text('phone'),
  rating: text('rating'),
  priceLevel: text('price_level'),
  image: text('image'),
  glbUrl: text('glb_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Services Catalog
export const services = pgTable('services', {
  id: text('id').primaryKey(),
  venueId: text('venue_id'),
  category: text('category').notNull(),
  name: text('name').notNull(),
  duration: text('duration').notNull(),
  price: integer('price').notNull(),
  desc: text('desc'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Professionals / Specialists
export const professionals = pgTable('professionals', {
  id: text('id').primaryKey(),
  venueId: text('venue_id'),
  name: text('name').notNull(),
  role: text('role').notNull(),
  avatar: text('avatar'),
  rating: text('rating'),
  reviews: integer('reviews').default(0),
  status: text('status').default('Disponible').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Appointments / Bookings
export const appointments = pgTable('appointments', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  venueName: text('venue_name').notNull(),
  client: text('client').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  notes: text('notes'),
  serviceId: text('service_id'),
  service: text('service').notNull(),
  proId: text('pro_id'),
  pro: text('pro').notNull(),
  dateKey: text('date_key').notNull(),
  dayName: text('day_name').notNull(),
  time: text('time').notNull(),
  price: integer('price').notNull(),
  status: text('status').default('Confirmada').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Blocked schedule slots
export const blockedSlots = pgTable('blocked_slots', {
  id: text('id').primaryKey(),
  day: text('day').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  proId: text('pro_id').notNull(),
  proName: text('pro_name').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. WhatsApp Business Configuration
export const whatsappConfigs = pgTable('whatsapp_configs', {
  id: text('id').primaryKey(),
  enabled: boolean('enabled').default(true).notNull(),
  businessPhone: text('business_phone').notNull(),
  autoOpenChat: boolean('auto_open_chat').default(true).notNull(),
  confirmationTemplate: text('confirmation_template').notNull(),
  reminder24hTemplate: text('reminder24h_template').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({}) => ({}));
