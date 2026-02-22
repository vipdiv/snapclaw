import { NextResponse } from 'next/server';
import { getOrCreateSid, oauthClient } from '@/lib/auth';

export async function GET() {
  getOrCreateSid();
  const client = oauthClient();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
  return NextResponse.redirect(url);
}
