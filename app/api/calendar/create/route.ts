import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { authedClientFromCookie } from '@/lib/auth';

export async function POST(req: Request) {
  const auth = await authedClientFromCookie();
  if (!auth) return NextResponse.json({ error: 'Google connection required.', connectRequired: true }, { status: 401 });
  const body = await req.json();
  const calendar = google.calendar({ version: 'v3', auth: auth.client });
  const start = body.date ? new Date(`${body.date} ${body.time || '09:00'}`) : new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: body.title || 'SnapClaw Event',
      location: body.location || undefined,
      description: body.extractedText || '',
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });
  return NextResponse.json({ message: 'Calendar event created.' });
}
