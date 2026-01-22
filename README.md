# Manege Duikse Hoef Email Service

Email service voor het versturen van emails via Strato SMTP via Vercel API Routes.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment Variables

Zet de volgende environment variables in Vercel:

- `STRATO_USER` - Je Strato email adres (bijv. `info@manegeduiksehoef.nl`)
- `STRATO_PASSWORD` - Je Strato email wachtwoord
- `STRATO_FROM_EMAIL` (optioneel) - Email adres voor "from" veld (default: STRATO_USER)
- `EMAIL_API_KEY` - **VERPLICHT** - API key voor beveiliging (bijv. `manege-strato-email-2026-secure-key-99xtif26dpbjjnp9x4hzrh`)

### 3. Deploy naar Vercel

#### Via Vercel CLI:
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Via GitHub + Vercel:
1. Push naar GitHub repository
2. Ga naar [Vercel Dashboard](https://vercel.com/dashboard)
3. Klik "New Project"
4. Import je GitHub repository
5. Zet environment variables in Vercel dashboard
6. Deploy

## API Usage

### Endpoint 1: Basis Email Verzenden
```
POST /api/send-email
```

### Request Body
```json
{
  "to": "email@example.com",
  "subject": "Onderwerp van de email",
  "htmlBody": "<p>HTML inhoud</p>",
  "textBody": "Platte tekst versie"
}
```

### Endpoint 2: Template Email Verzenden (Aanbevolen)
```
POST /api/send-template-email
```

Gebruik mooie HTML templates met de Manege Duikse Hoef layout.

#### Credentials Template
```json
{
  "to": "klant@example.com",
  "subject": "Inloggegevens - Manege Duikse Hoef",
  "template": "credentials",
  "customerName": "Jan Jansen",
  "customerEmail": "jan@example.com",
  "password": "WACHTWOORD123",
  "appUrl": "https://manege-duikse-hoef.vercel.app"
}
```

#### Payment Template
```json
{
  "to": "klant@example.com",
  "subject": "Betaalverzoek - Manege Duikse Hoef",
  "template": "payment",
  "customerName": "Jan Jansen",
  "paymentDescription": "Leskaart 10 lessen",
  "paymentAmount": 150.00,
  "paymentUrl": "https://example.com/payment"
}
```

#### Custom Template
```json
{
  "to": "klant@example.com",
  "subject": "Onderwerp",
  "template": "custom",
  "title": "Titel van de email",
  "greeting": "Beste klant,",
  "content": "<p>Je custom HTML content hier</p>",
  "buttonText": "Klik hier",
  "buttonUrl": "https://example.com",
  "showButton": true
}
```

#### Test Template
```json
{
  "to": "test@example.com",
  "subject": "Test Email",
  "template": "test"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Email succesvol verstuurd naar email@example.com",
  "messageId": "<message-id>"
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "Error message"
}
```

## Voorbeeld gebruik

### JavaScript/TypeScript
```javascript
const API_KEY = 'manege-strato-email-2026-secure-key-99xtif26dpbjjnp9x4hzrh'; // Je API key uit Vercel

const response = await fetch('https://jouw-project.vercel.app/api/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY, // ← Verplicht!
  },
  body: JSON.stringify({
    to: 'klant@example.com',
    subject: 'Welkom bij Manege Duikse Hoef',
    htmlBody: '<h1>Welkom!</h1><p>Bedankt voor je aanmelding.</p>',
    textBody: 'Welkom! Bedankt voor je aanmelding.',
  }),
});

const result = await response.json();
console.log(result);
```

### cURL
```bash
curl -X POST https://jouw-project.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: manege-strato-email-2026-secure-key-99xtif26dpbjjnp9x4hzrh" \
  -d '{
    "to": "klant@example.com",
    "subject": "Test Email",
    "htmlBody": "<p>Dit is een test</p>",
    "textBody": "Dit is een test"
  }'
```

## Features

- ✅ Node.js runtime (geen Edge Function timeouts)
- ✅ Strato SMTP integratie
- ✅ HTML en plain text support
- ✅ Email validatie
- ✅ **API key beveiliging**
- ✅ CORS support
- ✅ Proper error handling
- ✅ Production-ready

## Troubleshooting

### Email komt niet aan
- Check spam folder
- Controleer of STRATO_USER en STRATO_PASSWORD correct zijn ingesteld
- Check Vercel function logs voor errors

### Timeout errors
- Dit zou niet moeten voorkomen met Node.js runtime
- Check Vercel function logs voor meer details

### CORS errors
- CORS headers zijn al ingesteld
- Zorg dat je de juiste Content-Type header gebruikt

## License

MIT
