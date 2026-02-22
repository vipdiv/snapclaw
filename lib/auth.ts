import crypto from 'crypto';
import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { getRefreshToken } from './store';

export const sidCookie = 'snapclaw_sid';

export function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getOrCreateSid() {
  const c = cookies();
  let sid = c.get(sidCookie)?.value;
  if (!sid) {
    sid = crypto.randomBytes(16).toString('hex');
    c.set(sidCookie, sid, { httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
  }
  return sid;
}

export function getSid() {
  return cookies().get(sidCookie)?.value || null;
}

export async function authedClientFromCookie() {
  const sid = getSid();
  if (!sid) return null;
  const refreshToken = getRefreshToken(sid);
  if (!refreshToken) return null;
  const client = oauthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return { client, sid };
}
