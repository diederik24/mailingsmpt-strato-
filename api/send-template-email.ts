import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import {
  createManegeEmailTemplate,
  createCredentialsEmailTemplate,
  createPaymentRequestTemplate,
  createTestEmailTemplate,
} from './email-templates';

// Expliciet Node.js runtime gebruiken (NIET Edge)
export const config = {
  runtime: 'nodejs',
};

interface TemplateEmailPayload {
  to: string;
  subject: string;
  template: 'credentials' | 'payment' | 'test' | 'custom';
  // Voor credentials template
  customerName?: string;
  customerEmail?: string;
  password?: string;
  appUrl?: string;
  // Voor payment template
  paymentDescription?: string;
  paymentAmount?: number;
  paymentUrl?: string;
  // Voor custom template
  title?: string;
  greeting?: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
  showButton?: boolean;
  // Fallback voor plain text
  textBody?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Alleen POST requests accepteren
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are supported.',
    });
  }

  // Check API key
  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.EMAIL_API_KEY;

  if (!expectedApiKey) {
    console.error('EMAIL_API_KEY not configured in environment variables');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error: EMAIL_API_KEY not set',
    });
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key. Provide X-API-Key header.',
    });
  }

  try {
    const payload: TemplateEmailPayload = req.body;

    // Valideer verplichte velden
    if (!payload.to || !payload.subject || !payload.template) {
      return res.status(400).json({
        success: false,
        error: 'To, subject en template zijn verplicht',
      });
    }

    // Valideer email formaat
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.to)) {
      return res.status(400).json({
        success: false,
        error: 'Ongeldig email adres',
      });
    }

    // Genereer HTML body op basis van template
    let htmlBody: string;
    let textBody: string = payload.textBody || '';

    switch (payload.template) {
      case 'credentials':
        if (!payload.customerName || !payload.customerEmail || !payload.password) {
          return res.status(400).json({
            success: false,
            error: 'Voor credentials template zijn customerName, customerEmail en password verplicht',
          });
        }
        htmlBody = createCredentialsEmailTemplate(
          payload.customerName,
          payload.customerEmail,
          payload.password,
          payload.appUrl || 'https://manege-duikse-hoef.vercel.app'
        );
        textBody = textBody || `Inloggegevens voor ${payload.customerName}\n\nEmail: ${payload.customerEmail}\nWachtwoord: ${payload.password}`;
        break;

      case 'payment':
        if (!payload.paymentDescription || payload.paymentAmount === undefined || !payload.paymentUrl) {
          return res.status(400).json({
            success: false,
            error: 'Voor payment template zijn paymentDescription, paymentAmount en paymentUrl verplicht',
          });
        }
        htmlBody = createPaymentRequestTemplate(
          payload.customerName || 'Klant',
          payload.paymentDescription,
          payload.paymentAmount,
          payload.paymentUrl
        );
        textBody = textBody || `Betaalverzoek\n\n${payload.paymentDescription}\nBedrag: €${payload.paymentAmount.toFixed(2)}\n\nBetaal hier: ${payload.paymentUrl}`;
        break;

      case 'test':
        htmlBody = createTestEmailTemplate(new Date().toLocaleString('nl-NL'));
        textBody = textBody || 'Dit is een test email.';
        break;

      case 'custom':
        if (!payload.title || !payload.greeting || !payload.content) {
          return res.status(400).json({
            success: false,
            error: 'Voor custom template zijn title, greeting en content verplicht',
          });
        }
        htmlBody = createManegeEmailTemplate({
          title: payload.title,
          greeting: payload.greeting,
          content: payload.content,
          buttonText: payload.buttonText,
          buttonUrl: payload.buttonUrl,
          showButton: payload.showButton || false,
        });
        textBody = textBody || payload.content.replace(/<[^>]*>/g, '');
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Onbekend template type: ${payload.template}`,
        });
    }

    // Haal SMTP credentials op uit environment variables
    const stratoUser = process.env.STRATO_USER;
    const stratoPassword = process.env.STRATO_PASSWORD;
    const stratoFromEmail = process.env.STRATO_FROM_EMAIL || stratoUser;

    if (!stratoUser || !stratoPassword) {
      console.error('Strato SMTP credentials missing');
      return res.status(500).json({
        success: false,
        error: 'SMTP configuratie niet gevonden. Zorg dat STRATO_USER en STRATO_PASSWORD zijn ingesteld in Vercel environment variables.',
      });
    }

    // Maak Strato SMTP transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.strato.com',
      port: 587,
      secure: false,
      auth: {
        user: stratoUser,
        pass: stratoPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Email opties
    const mailOptions = {
      from: `"Manege Duikse Hoef" <${stratoFromEmail}>`,
      to: payload.to,
      subject: payload.subject,
      text: textBody || htmlBody.replace(/<[^>]*>/g, ''),
      html: htmlBody,
      headers: {
        'List-Unsubscribe': `<mailto:${stratoFromEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Mailer': 'Manege Duikse Hoef System',
      },
      replyTo: stratoFromEmail,
    };

    // Verstuur email
    console.log(`Sending template email (${payload.template}) to: ${payload.to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);

    // Sluit transporter af
    transporter.close();

    // Succesvolle response
    return res.status(200).json({
      success: true,
      message: `Email succesvol verstuurd naar ${payload.to}`,
      messageId: info.messageId,
      template: payload.template,
    });

  } catch (error: any) {
    console.error('Error sending email:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Fout bij verzenden van email',
    });
  }
}
