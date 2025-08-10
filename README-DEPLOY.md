# OmsorgsPlus – Deploy-pack (Render + MongoDB Atlas)

Den här packen innehåller filer och instruktioner för att driftsätta din app på **Render (Web Service)** med **MongoDB Atlas** och Gmail app‑lösen.

## Innehåll
- `render.yaml` – Render Blueprint (repo-baserad deploy)
- `.env.example` – kopiera till `.env` lokalt och fyll i värden
- `postman/OmsorgsPlus.postman_collection.json` – endpoints för snabb test
- `.github/workflows/ci.yml` – enkel CI (lint/build) innan deploy
- `snippets/index-security-patch.js` – säkerhets-middleware + healthz-snutt

---

## Snabbguide (10–20 min)

### 1) Förbered hemligheter
1. **MongoDB Atlas**
   - Skapa projekt + gratis cluster.
   - Skapa DB‑user (t.ex. `omsorgsplus_user`) och lösenord.
   - Network Access: lägg till Render IP‑range eller (tillfälligt) `0.0.0.0/0`.
   - Kopiera **connection string** (SRV) och ersätt `<password>` och ev. `?retryWrites=true&w=majority`.
   - Sätt ett DB‑namn, t.ex. `omsorgsplus`.

2. **Gmail app‑lösen**
   - Aktivera 2FA på kontot.
   - Skapa **App Password**: typ *Mail*, enhet *Other*, döp t.ex. `OmsorgsPlus`.
   - `MAIL_USER` = din Gmail‑adress, `MAIL_PASS` = app‑lösenordet (16 tecken).

3. **.env**
   - Kopiera `.env.example` → `.env` och fyll i värden lokalt (för dev)
   - På Render sätter du **samma nycklar** under *Environment*.

### 2) Render (Web Service)
1. Lägg repo:t på GitHub (eller koppla det repo du redan har).
2. **Alternativ A (Blueprint)**: checka in `render.yaml` i repo-root och skapa från *Blueprints* i Render.  
   **Alternativ B (manuellt)**: *New → Web Service* och fyll i:
   - **Environment:** Node
   - **Region:** EU (Frankfurt)
   - **Build command:** `npm install`
   - **Start command:** `node index.js`
   - **Auto deploy:** On
   - **Environment variables:** enligt `.env.example` (fyll MONGO_URL/MAIL_* m.m.)

3. Lägg till **Custom Domain**: `https://omsorgsplus.se` under *Settings → Custom Domains*, följ DNS‑instruktionerna (CNAME mot `onrender.com` domänen).
4. När deployen är klar: öppna tjänsten. Statisk frontend (din `public/`) serveras från samma app, och API nås under `/api/...`.

### 3) Säkerhet & hälsokontroll (lägg till i `index.js`)
Infoga koden i `snippets/index-security-patch.js` högst upp i din app **före** dina routes. Den lägger till:
- `helmet` (säkerhetshuvuden)
- `express-rate-limit` (grunndämpning)
- `mongo-sanitize` (skydd mot operator‑injection)
- `morgan` (loggning)
- strypt CORS till `https://omsorgsplus.se`
- `GET /healthz` för uptime‑monitorering

> Glöm inte `npm i helmet express-rate-limit express-mongo-sanitize morgan`

### 4) Postman
Importera `postman/OmsorgsPlus.postman_collection.json`, uppdatera `{{baseUrl}}` (default: `https://omsorgsplus.se`) och kör igenom:
- `GET /healthz`
- `GET /api/staff`
- `POST /api/contact`, `POST /api/bookings` etc.

### 5) Tips
- Aktivera *Force HTTPS* i Render *Settings*.
- Lägg till *Background Worker* senare om du vill köra batchjobb.
- Senare: byt från Gmail till t.ex. Brevo/SendGrid för bättre leverans.

Behöver du att jag applicerar patchen på din `index.js` åt dig? Säg till, så ger jag dig en färdig fil.
