import { NextRequest, NextResponse } from 'next/server';
import { getSid, oauthClient } from '@/lib/auth';
import { saveRefreshToken } from '@/lib/store';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const sid = getSid();
  if (!code || !sid) return NextResponse.redirect(`${process.env.APP_BASE_URL || ''}/?error=auth`);
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  if (tokens.refresh_token) saveRefreshToken(sid, tokens.refresh_token);
  return NextResponse.redirect(`${process.env.APP_BASE_URL || ''}/`);
}
