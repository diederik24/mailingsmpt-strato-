// Test script voor de email API
// Gebruik: node test-api.js

const API_URL = process.env.API_URL || 'http://localhost:3000/api/send-email';

async function testEmailAPI() {
  try {
    console.log('📧 Test email API...\n');
    console.log(`API URL: ${API_URL}\n`);

    const emailData = {
      to: 'Diederik24@icloud.com',
      subject: 'Test Email - Manege Duikse Hoef Email Service',
      htmlBody: `
        <h2>Dit is een test email</h2>
        <p>Deze email is verstuurd via de Vercel API route met Strato SMTP.</p>
        <p>Als je deze email ontvangt, werkt alles correct!</p>
        <p><strong>Tijdstip:</strong> ${new Date().toLocaleString('nl-NL')}</p>
      `,
      textBody: `
Dit is een test email

Deze email is verstuurd via de Vercel API route met Strato SMTP.
Als je deze email ontvangt, werkt alles correct!

Tijdstip: ${new Date().toLocaleString('nl-NL')}
      `,
    };

    console.log('Versturen naar:', emailData.to);
    console.log('Onderwerp:', emailData.subject);
    console.log('\n');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Succes!');
      console.log('Resultaat:', JSON.stringify(result, null, 2));
      console.log('\n📬 Check je inbox (en spam folder) voor de email!');
    } else {
      console.error('❌ Fout:');
      console.error('Status:', response.status);
      console.error('Error:', result);
    }
  } catch (error) {
    console.error('❌ Fout:', error.message);
    console.error('\nZorg dat:');
    console.error('1. De API draait (vercel dev of deployed)');
    console.error('2. Environment variables zijn ingesteld');
    console.error('3. De API_URL klopt (standaard: http://localhost:3000/api/send-email)');
  }
}

testEmailAPI();
