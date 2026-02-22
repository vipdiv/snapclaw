import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'data', 'store.json');

type UserStore = { refreshToken: string; spreadsheetId?: string };
type DB = Record<string, UserStore>;

function keyBuf() {
  return crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'dev').digest();
}

function encrypt(text: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf(), iv);
  const out = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, out]).toString('base64');
}

function decrypt(enc: string) {
  const raw = Buffer.from(enc, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const content = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(content), decipher.final()]).toString('utf8');
}

function readDB(): DB {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeDB(db: DB) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
}

export function saveRefreshToken(userId: string, refreshToken: string) {
  const db = readDB();
  db[userId] = { ...(db[userId] || {}), refreshToken: encrypt(refreshToken) };
  writeDB(db);
}

export function getRefreshToken(userId: string) {
  const db = readDB();
  const entry = db[userId];
  if (!entry?.refreshToken) return null;
  return decrypt(entry.refreshToken);
}

export function getSpreadsheetId(userId: string) {
  return readDB()[userId]?.spreadsheetId || null;
}

export function saveSpreadsheetId(userId: string, spreadsheetId: string) {
  const db = readDB();
  db[userId] = { ...(db[userId] || {}), spreadsheetId };
  writeDB(db);
}
