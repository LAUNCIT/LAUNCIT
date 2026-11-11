import { Appointment } from '../types';
import { formatCOP } from './scheduleUtils';

export interface WhatsAppVariable {
  tag: string;
  label: string;
  example: string;
  description: string;
}

export const AVAILABLE_VARIABLES: WhatsAppVariable[] = [
  {
    tag: '{{cliente_nombre}}',
    label: 'Nombre del Cliente',
    example: 'Carlos Mendoza',
    description: 'Nombre y apellido proporcionado al reservar sin registro',
  },
  {
    tag: '{{servicio}}',
    label: 'Servicio Reservado',
    example: 'Corte Fade Pro & Asesoría',
    description: 'Nombre del corte o tratamiento seleccionado',
  },
  {
    tag: '{{fecha}}',
    label: 'Fecha de la Cita',
    example: 'Mar, 10 Nov',
    description: 'Día y fecha calendarizada',
  },
  {
    tag: '{{hora}}',
    label: 'Hora de la Cita',
    example: '10:00 AM',
    description: 'Horario acordado del turno',
  },
  {
    tag: '{{precio}}',
    label: 'Precio Total en COP',
    example: '$35.000 COP',
    description: 'Tarifa del servicio en pesos colombianos',
  },
  {
    tag: '{{profesional}}',
    label: 'Especialista / Barbero',
    example: 'Mateo Silva',
    description: 'Nombre del profesional asignado',
  },
  {
    tag: '{{codigo}}',
    label: 'Código de Reserva',
    example: 'GLW-4091',
    description: 'Código único para consultar o verificar la cita',
  },
  {
    tag: '{{establecimiento}}',
    label: 'Nombre del Negocio',
    example: 'The Barber Club Flagship',
    description: 'Nombre del local o sede',
  },
  {
    tag: '{{enlace_confirmacion}}',
    label: 'Enlace Web de Consulta',
    example: 'https://glowcitas.com/cita/GLW-4091',
    description: 'Enlace directo para consultar el ticket sin cuenta',
  },
  {
    tag: '{{telefono}}',
    label: 'Teléfono del Cliente',
    example: '+57 312 456 7890',
    description: 'WhatsApp del cliente',
  },
];

export interface WhatsAppPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  template: string;
}

export const WHATSAPP_PRESETS: WhatsAppPreset[] = [
  {
    id: 'signature',
    name: 'Glow Signature',
    badge: 'Recomendado',
    description: 'Plantilla elegante y completa con emojis, detalles y variables dinámicas.',
    template: `✨ *¡Hola {{cliente_nombre}}! Tu reserva en {{establecimiento}} está confirmada* ✨

📋 *Resumen de tu Cita:*
• *Código:* #{{codigo}}
• *Servicio:* {{servicio}}
• *Especialista:* {{profesional}}
• *Fecha:* {{fecha}}
• *Hora:* {{hora}}
• *Total a pagar:* {{precio}}

🔗 *Consulta tu comprobante en vivo:*
{{enlace_confirmacion}}

📍 *Recomendación:* Por favor llega 5 a 10 minutos antes para comenzar a tiempo.
Si deseas reprogramar o tienes alguna duda, escríbenos directamente a este chat.

¡Será un gusto atenderte! 💈✨`,
  },
  {
    id: 'express',
    name: 'Directa & Exprés',
    badge: 'Rápida',
    description: 'Directa al grano y concisa para turnos rápidos y barberías dinámicas.',
    template: `✅ *Cita Confirmada - {{establecimiento}}*

Hola *{{cliente_nombre}}*, te esperamos:
🗓 *Fecha:* {{fecha}} a las {{hora}}
✂️ *Servicio:* {{servicio}} (con {{profesional}})
💰 *Total:* {{precio}}
🔖 *Ref:* #{{codigo}}

🔗 *Comprobante:* {{enlace_confirmacion}}

¡Nos vemos pronto!`,
  },
  {
    id: 'policies',
    name: 'Con Políticas y Puntualidad',
    badge: 'Estricta',
    description: 'Incluye recordatorio de puntualidad y enlace de autogestión de citas.',
    template: `👋 *Hola {{cliente_nombre}}, confirmamos tu cita en {{establecimiento}}*

📌 *Ficha de Servicio:*
• Cita: #{{codigo}}
• Tratamiento: *{{servicio}}*
• Atiende: *{{profesional}}*
• Día: *{{fecha}}* | Hora: *{{hora}}*
• Valor: *{{precio}}*

🔗 *Ver comprobante digital:* {{enlace_confirmacion}}

⚠️ *Políticas de Asistencia:*
- Contamos con 10 minutos de tolerancia para garantizar la atención puntual de todos los turnos.
- Reprogramaciones o cancelaciones con mínimo 2 horas de anticipación.

¡Gracias por elegirnos! Te esperamos en {{establecimiento}}.`,
  },
];

export function compileWhatsAppMessage(
  template: string,
  appt?: Partial<Appointment>,
  customFallbacks?: Partial<{
    venueName: string;
    client: string;
    service: string;
    pro: string;
    dateKey: string;
    time: string;
    price: number | string;
    code: string;
    phone: string;
  }>
): string {
  if (!template) return '';

  const clientName = appt?.client || customFallbacks?.client || 'Carlos Mendoza';
  const serviceName = appt?.service || customFallbacks?.service || 'Corte Fade Pro & Asesoría';
  const proName = appt?.pro || customFallbacks?.pro || 'Mateo Silva';
  const dateStr = appt?.dateKey || customFallbacks?.dateKey || 'Mar, 10 Nov';
  const timeStr = appt?.time || customFallbacks?.time || '10:00 AM';
  const codeStr = appt?.code || customFallbacks?.code || 'GLW-4091';
  const venueStr = appt?.venueName || customFallbacks?.venueName || 'The Barber Club Flagship';
  const phoneStr = appt?.phone || customFallbacks?.phone || '+57 312 456 7890';

  let priceStr = '$35.000 COP';
  if (appt?.price !== undefined) {
    priceStr = typeof appt.price === 'number' ? formatCOP(appt.price) : String(appt.price);
  } else if (customFallbacks?.price !== undefined) {
    priceStr = typeof customFallbacks.price === 'number' ? formatCOP(customFallbacks.price) : String(customFallbacks.price);
  }

  const cleanPhone = cleanPhoneNumber(phoneStr);
  const confirmationUrl = `https://glowcitas.com/reserva?codigo=${encodeURIComponent(codeStr)}&tel=${encodeURIComponent(cleanPhone)}`;

  const map: Record<string, string> = {
    cliente_nombre: clientName,
    nombre_cliente: clientName,
    cliente: clientName,
    client: clientName,
    nombre: clientName,
    servicio: serviceName,
    service: serviceName,
    profesional: proName,
    pro: proName,
    especialista: proName,
    fecha: dateStr,
    date: dateStr,
    hora: timeStr,
    time: timeStr,
    precio: priceStr,
    total: priceStr,
    price: priceStr,
    codigo: codeStr,
    code: codeStr,
    ref: codeStr,
    establecimiento: venueStr,
    negocio: venueStr,
    venue: venueStr,
    telefono: phoneStr,
    phone: phoneStr,
    enlace_confirmacion: confirmationUrl,
    link_confirmacion: confirmationUrl,
    enlace: confirmationUrl,
    link: confirmationUrl,
  };

  // Replaces both {{tag}} and {tag}, case-insensitive
  return template.replace(/\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/g, (match, key) => {
    const lowerKey = key.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(map, lowerKey)) {
      return map[lowerKey];
    }
    return match;
  });
}

export function cleanPhoneNumber(phone: string): string {
  // Remove spaces, parentheses, dashes
  let clean = phone.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+')) {
    clean = clean.substring(1);
  }
  // If Colombia number without 57, prepend 57
  if (clean.length === 10 && clean.startsWith('3')) {
    clean = '57' + clean;
  }
  return clean;
}

export function generateWhatsAppUrl(phone: string, text: string): string {
  const clean = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (clean) {
    return `https://wa.me/${clean}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}
