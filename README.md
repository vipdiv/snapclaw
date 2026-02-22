# SnapClaw

Mobile-first screenshot assistant with client-side OCR, editable extraction, Google Calendar creation, and Google Sheets logging.

## Setup

1. Install deps:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill env vars:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `APP_BASE_URL`
   - `ENCRYPTION_KEY`

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.
