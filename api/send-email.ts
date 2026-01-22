import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

// Expliciet Node.js runtime gebruiken (NIET Edge)
export const config = {
  runtime: 'nodejs',
};

interface EmailPayload {
  to: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Alleen POST requests accepteren
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Only POST requests are supported.' 
    });
  }

  try {
    const { to, subject, htmlBody, textBody }: EmailPayload = req.body;

    // Valideer verplichte velden
    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'To en subject zijn verplicht',
      });
    }

    // Valideer email formaat
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Ongeldig email adres',
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
      secure: false, // true voor 465, false voor andere poorten
      auth: {
        user: stratoUser,
        pass: stratoPassword,
      },
      tls: {
        // Voorkomt problemen met zelfondertekende certificaten
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000, // 10 seconden timeout voor verbinding
      greetingTimeout: 10000, // 10 seconden timeout voor greeting
      socketTimeout: 10000, // 10 seconden socket timeout
    });

    // Email opties
    const mailOptions = {
      from: `"Manege Duikse Hoef" <${stratoFromEmail}>`,
      to: to,
      subject: subject,
      text: textBody || htmlBody?.replace(/<[^>]*>/g, '') || '', // Fallback naar HTML zonder tags
      html: htmlBody || textBody || '',
      headers: {
        'List-Unsubscribe': `<mailto:${stratoFromEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Mailer': 'Manege Duikse Hoef System',
      },
      replyTo: stratoFromEmail,
    };

    // Verstuur email
    console.log(`Sending email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);

    // Sluit transporter af
    transporter.close();

    // Succesvolle response
    return res.status(200).json({
      success: true,
      message: `Email succesvol verstuurd naar ${to}`,
      messageId: info.messageId,
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Fout bij verzenden van email',
    });
  }
}
