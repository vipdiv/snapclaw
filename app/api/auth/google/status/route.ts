import { NextResponse } from 'next/server';
import { getSid } from '@/lib/auth';
import { getRefreshToken } from '@/lib/store';

export async function GET() {
  const sid = getSid();
  if (!sid) return NextResponse.json({ connected: false });
  return NextResponse.json({ connected: Boolean(getRefreshToken(sid)) });
}
