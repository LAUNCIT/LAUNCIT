import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  getDbVenues,
  upsertDbVenue,
  getDbServices,
  upsertDbService,
  deleteDbService,
  getDbProfessionals,
  upsertDbProfessional,
  deleteDbProfessional,
  getDbAppointments,
  createDbAppointment,
  getDbBlockedSlots,
  createDbBlockedSlot,
  deleteDbBlockedSlot,
  getDbWhatsAppConfig,
  saveDbWhatsAppConfig,
} from './src/db/queries.ts';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static assets from public directory with proper MIME types
app.use(express.static(path.resolve(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.glb')) {
      res.setHeader('Content-Type', 'model/gltf-binary');
    } else if (filePath.endsWith('.gltf')) {
      res.setHeader('Content-Type', 'model/gltf+json');
    }
  }
}));

// Guard: Never return SPA index.html for non-existent 3D model assets
app.get(/\.(glb|gltf|bin)$/i, (_req, res) => {
  res.status(404).type('text/plain').send('3D model asset not found');
});

// Run initial seed on startup lazily
seedDatabaseIfEmpty().catch((err) => {
  console.error('Initial database seed error:', err);
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Sync authenticated user (Partner / Business Owner)
app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || '';
    const name = (req.user as any)?.name || undefined;

    if (!uid) {
      return res.status(400).json({ error: 'Missing UID in user token' });
    }

    const userRecord = await getOrCreateUser(uid, email, name);
    res.json(userRecord);
  } catch (error: any) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Venues
app.get('/api/venues', async (_req, res) => {
  try {
    const data = await getDbVenues();
    res.json(data);
  } catch (error: any) {
    console.error('Failed to fetch venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

app.post('/api/venues', async (req, res) => {
  try {
    const venue = req.body;
    if (!venue.name) {
      return res.status(400).json({ error: 'Missing venue name' });
    }
    if (!venue.id) {
      venue.id = `venue_${Date.now()}`;
    }
    if (!venue.category) {
      venue.category = 'belleza';
    }
    const saved = await upsertDbVenue(venue);
    res.json(saved);
  } catch (error: any) {
    console.error('Failed to save venue:', error);
    res.status(500).json({ error: 'Failed to save venue' });
  }
});

// Services
app.get('/api/services', async (_req, res) => {
  try {
    const data = await getDbServices();
    res.json(data);
  } catch (error: any) {
    console.error('Failed to fetch services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/services', requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = req.body;
    if (!item.name || !item.price || !item.duration) {
      return res.status(400).json({ error: 'Missing required service fields' });
    }
    const saved = await upsertDbService(item);
    res.json(saved);
  } catch (error: any) {
    console.error('Failed to save service:', error);
    res.status(500).json({ error: 'Failed to save service' });
  }
});

app.delete('/api/services/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await deleteDbService(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Professionals
app.get('/api/professionals', async (_req, res) => {
  try {
    const data = await getDbProfessionals();
    res.json(data);
  } catch (error: any) {
    console.error('Failed to fetch professionals:', error);
    res.status(500).json({ error: 'Failed to fetch professionals' });
  }
});

app.post('/api/professionals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pro = req.body;
    if (!pro.name || !pro.role) {
      return res.status(400).json({ error: 'Missing required specialist fields' });
    }
    const saved = await upsertDbProfessional(pro);
    res.json(saved);
  } catch (error: any) {
    console.error('Failed to save professional:', error);
    res.status(500).json({ error: 'Failed to save professional' });
  }
});

app.delete('/api/professionals/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await deleteDbProfessional(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete professional:', error);
    res.status(500).json({ error: 'Failed to delete professional' });
  }
});

// Appointments (Public create for zero-registration customer booking)
app.get('/api/appointments', async (req, res) => {
  try {
    const phoneFilter = req.query.phone as string | undefined;
    const all = await getDbAppointments();
    if (phoneFilter) {
      const cleanPhone = phoneFilter.replace(/[^0-9]/g, '');
      const filtered = all.filter((a) => a.phone.replace(/[^0-9]/g, '') === cleanPhone);
      return res.json(filtered);
    }
    res.json(all);
  } catch (error: any) {
    console.error('Failed to fetch appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const appt = req.body;
    if (!appt.client || !appt.phone || !appt.service || !appt.dateKey || !appt.time) {
      return res.status(400).json({ error: 'Missing required appointment fields' });
    }
    const saved = await createDbAppointment(appt);
    res.status(201).json(saved);
  } catch (error: any) {
    console.error('Failed to create appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Blocked Slots
app.get('/api/blocked-slots', async (_req, res) => {
  try {
    const data = await getDbBlockedSlots();
    res.json(data);
  } catch (error: any) {
    console.error('Failed to fetch blocked slots:', error);
    res.status(500).json({ error: 'Failed to fetch blocked slots' });
  }
});

app.post('/api/blocked-slots', requireAuth, async (req: AuthRequest, res) => {
  try {
    const slot = req.body;
    if (!slot.day || !slot.startTime || !slot.endTime || !slot.proId) {
      return res.status(400).json({ error: 'Missing required blocked slot fields' });
    }
    const saved = await createDbBlockedSlot(slot);
    res.json(saved);
  } catch (error: any) {
    console.error('Failed to create blocked slot:', error);
    res.status(500).json({ error: 'Failed to create blocked slot' });
  }
});

app.delete('/api/blocked-slots/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await deleteDbBlockedSlot(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete blocked slot:', error);
    res.status(500).json({ error: 'Failed to delete blocked slot' });
  }
});

// WhatsApp Config
app.get('/api/whatsapp-config', async (_req, res) => {
  try {
    const config = await getDbWhatsAppConfig();
    res.json(config);
  } catch (error: any) {
    console.error('Failed to fetch WhatsApp config:', error);
    res.status(500).json({ error: 'Failed to fetch WhatsApp config' });
  }
});

app.post('/api/whatsapp-config', requireAuth, async (req: AuthRequest, res) => {
  try {
    const config = req.body;
    const saved = await saveDbWhatsAppConfig(config);
    res.json(saved);
  } catch (error: any) {
    console.error('Failed to save WhatsApp config:', error);
    res.status(500).json({ error: 'Failed to save WhatsApp config' });
  }
});

// Vite Middleware in Development, Static Serving in Production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Glow Citas server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
