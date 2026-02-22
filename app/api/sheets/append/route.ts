import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { authedClientFromCookie } from '@/lib/auth';
import { getSpreadsheetId, saveSpreadsheetId } from '@/lib/store';

export async function POST(req: Request) {
  const auth = await authedClientFromCookie();
  if (!auth) return NextResponse.json({ error: 'Google connection required.', connectRequired: true }, { status: 401 });
  const body = await req.json();
  const sheets = google.sheets({ version: 'v4', auth: auth.client });
  let sheetId = getSpreadsheetId(auth.sid);

  if (!sheetId) {
    const created = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: 'SnapClaw Log' },
        sheets: [{ properties: { title: 'Log' } }],
      },
    });
    sheetId = created.data.spreadsheetId || '';
    if (!sheetId) return NextResponse.json({ error: 'Failed to create sheet.' }, { status: 500 });
    saveSpreadsheetId(auth.sid, sheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Log!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Timestamp', 'Mode (CALENDAR/SIGNAL)', 'Title', 'Date', 'Time', 'Location', 'Category', 'Extracted Text',
        ]],
      },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Log!A:H',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        new Date().toISOString(),
        body.mode || 'SIGNAL',
        body.title || '',
        body.date || '',
        body.time || '',
        body.location || '',
        body.category || 'OTHER',
        body.extractedText || '',
      ]],
    },
  });

  return NextResponse.json({ message: 'Logged to Google Sheet.' });
}
