/**
 * Email templates voor Manege Duikse Hoef
 * Gebruikt dezelfde layout als de bestaande Gmail templates
 */

export interface EmailTemplateOptions {
  title: string;
  greeting: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  showButton?: boolean;
}

/**
 * Maak een HTML email template met de Manege Duikse Hoef layout
 */
export function createManegeEmailTemplate(options: EmailTemplateOptions): string {
  const {
    title,
    greeting,
    content,
    buttonText,
    buttonUrl,
    showButton = false,
  } = options;

  const buttonHtml = showButton && buttonText && buttonUrl
    ? `
            <div style="text-align: center;">
                <a href="${buttonUrl}" class="button">${buttonText}</a>
            </div>
        `
    : '';

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #E72D81;
        }
        .header h1 {
            color: #E72D81;
            margin: 0;
            font-size: 28px;
        }
        .content {
            margin-bottom: 30px;
        }
        .content h2 {
            color: #333;
            font-size: 20px;
            margin-top: 0;
        }
        .content p {
            color: #666;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .login-info {
            background-color: #f9f9f9;
            border-left: 4px solid #E72D81;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .login-info h3 {
            color: #E72D81;
            margin-top: 0;
            font-size: 18px;
        }
        .login-info p {
            margin: 5px 0;
            font-size: 14px;
        }
        .password-box {
            background-color: #f0f0f0;
            padding: 10px 15px;
            border-radius: 4px;
            font-size: 18px;
            font-weight: bold;
            color: #E72D81;
            text-align: center;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
        }
        .payment-info {
            background-color: #f9f9f9;
            border-left: 4px solid #E72D81;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .payment-amount {
            font-size: 32px;
            font-weight: bold;
            color: #E72D81;
            margin: 15px 0;
        }
        .button {
            display: inline-block;
            background-color: #E72D81;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #C2185B;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }
        .steps {
            margin: 20px 0;
        }
        .steps ol {
            padding-left: 20px;
        }
        .steps li {
            margin: 10px 0;
            color: #666;
        }
        .warning-box {
            margin-top: 15px;
            padding: 15px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐴 Manege Duikse Hoef</h1>
        </div>
        
        <div class="content">
            <h2>${title}</h2>
            
            <p>${greeting}</p>
            
            ${content}
            
            ${buttonHtml}
            
            <p>Met vriendelijke groet,<br>
            Manege Duikse Hoef</p>
        </div>
        
        <div class="footer">
            <p>Manege Duikse Hoef<br>
            Duikse Hoef 1, 5175 PG Loon op Zand<br>
            <a href="mailto:info@manegeduiksehoef.nl" style="color: #E72D81; text-decoration: none;">info@manegeduiksehoef.nl</a> | +31 620685310</p>
        </div>
    </div>
</body>
</html>
`;
}

/**
 * Template voor inloggegevens email
 */
export function createCredentialsEmailTemplate(
  customerName: string,
  customerEmail: string,
  password: string,
  appUrl: string = 'https://manege-duikse-hoef.vercel.app'
): string {
  return createManegeEmailTemplate({
    title: 'Inloggegevens Webapp',
    greeting: `Beste ${customerName},`,
    content: `
            <p>Hier zijn je inloggegevens voor de Manege Duikse Hoef webapp:</p>
            
            <div class="login-info">
                <h3>📱 Inloggegevens</h3>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Wachtwoord:</strong></p>
                <div class="password-box">${password}</div>
            </div>
            
            <div class="steps">
                <h3>Hoe log je in?</h3>
                <ol>
                    <li>Ga naar de webapp: <a href="${appUrl}">${appUrl}</a></li>
                    <li>Vul het email adres in: <strong>${customerEmail}</strong></li>
                    <li>Vul het wachtwoord in: <strong>${password}</strong></li>
                    <li>Klik op "Inloggen"</li>
                </ol>
                <div class="warning-box">
                    <strong>💡 Tip:</strong> Het wachtwoord kan later worden gewijzigd in het profiel menu van de webapp.
                </div>
            </div>
        `,
    buttonText: 'Ga naar de webapp',
    buttonUrl: appUrl,
    showButton: true,
  });
}

/**
 * Template voor betaalverzoek email
 */
export function createPaymentRequestTemplate(
  customerName: string,
  paymentDescription: string,
  paymentAmount: number,
  paymentUrl: string
): string {
  return createManegeEmailTemplate({
    title: 'Betaalverzoek',
    greeting: `Beste ${customerName},`,
    content: `
            <p>U heeft een betaalverzoek ontvangen voor:</p>
            
            <div class="payment-info">
                <p><strong>${paymentDescription}</strong></p>
                <div class="payment-amount">€ ${paymentAmount.toFixed(2)}</div>
            </div>
        `,
    buttonText: 'Betaal nu',
    buttonUrl: paymentUrl,
    showButton: true,
  });
}

/**
 * Template voor test email
 */
export function createTestEmailTemplate(timestamp: string): string {
  return createManegeEmailTemplate({
    title: 'Test Email - Manege Duikse Hoef',
    greeting: 'Beste gebruiker,',
    content: `
            <p>Dit is een test email om te controleren of de email configuratie werkt.</p>
            <p>Als je deze email ontvangt, werkt alles correct!</p>
            <p><strong>Tijdstip:</strong> ${timestamp}</p>
        `,
    showButton: false,
  });
}
