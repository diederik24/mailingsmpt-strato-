// Test script voor de template email API
// Gebruik: node test-template-api.js

const config = require('./config');

const API_URL = `${config.API_URL}/api/send-template-email`;

async function testTemplateEmailAPI() {
  try {
    console.log('📧 Test template email API...\n');
    console.log(`API URL: ${API_URL}\n`);

    // Test 1: Credentials template
    console.log('Test 1: Credentials template\n');
    const credentialsData = {
      to: 'Diederik24@icloud.com',
      subject: 'Inloggegevens - Manege Duikse Hoef',
      template: 'credentials',
      customerName: 'Diederik Straver',
      customerEmail: 'diederik24@icloud.com',
      password: 'TEST123',
      appUrl: 'https://manege-duikse-hoef.vercel.app',
    };

    console.log('Versturen credentials email...');
    const response1 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.API_KEY,
      },
      body: JSON.stringify(credentialsData),
    });

    const result1 = await response1.json();

    if (response1.ok && result1.success) {
      console.log('✅ Credentials email succesvol verzonden!');
      console.log('Message ID:', result1.messageId);
    } else {
      console.error('❌ Fout bij credentials email:');
      console.error(result1);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Payment template
    console.log('Test 2: Payment template\n');
    const paymentData = {
      to: 'Diederik24@icloud.com',
      subject: 'Betaalverzoek - Manege Duikse Hoef',
      template: 'payment',
      customerName: 'Diederik Straver',
      paymentDescription: 'Leskaart 10 lessen',
      paymentAmount: 150.00,
      paymentUrl: 'https://example.com/payment',
    };

    console.log('Versturen payment email...');
    const response2 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.API_KEY,
      },
      body: JSON.stringify(paymentData),
    });

    const result2 = await response2.json();

    if (response2.ok && result2.success) {
      console.log('✅ Payment email succesvol verzonden!');
      console.log('Message ID:', result2.messageId);
    } else {
      console.error('❌ Fout bij payment email:');
      console.error(result2);
    }

    console.log('\n📬 Check je inbox (en spam folder) voor de emails!');

  } catch (error) {
    console.error('❌ Fout:', error.message);
  }
}

testTemplateEmailAPI();
