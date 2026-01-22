// Test credentials template
const API_URL = 'https://mailingsmpt-strato.vercel.app/api/send-template-email';

async function testCredentials() {
  try {
    console.log('📧 Test credentials template...\n');

    const emailData = {
      to: 'Diederik24@icloud.com',
      subject: 'Welkom bij Manege Duikse Hoef - Je inloggegevens',
      template: 'custom',
      title: 'Welkom bij Manege Duikse Hoef',
      greeting: 'Beste Diederik,',
      content: `
        <p>Bedankt voor je aanmelding! Hier zijn je inloggegevens voor de webapp:</p>
        
        <div class="login-info">
          <h3>📱 Inloggegevens</h3>
          <p><strong>Email:</strong> diederik24@icloud.com</p>
          <p><strong>Code:</strong></p>
          <div class="password-box">TEST123</div>
        </div>
        
        <p>Je kunt nu inloggen op de webapp om je lessen te bekijken.</p>
      `,
      buttonText: 'Ga naar de webapp',
      buttonUrl: 'https://manege-duikse-hoef.vercel.app',
      showButton: true,
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
  }
}

testCredentials();
