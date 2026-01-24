import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Expliciet Node.js runtime gebruiken (NIET Edge)
export const config = {
  runtime: 'nodejs',
};

interface EmailPayload {
  to: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  // Payment tracking velden (optioneel)
  paymentId?: string;
  paymentUrl?: string;
  paymentAmount?: number;
  paymentDescription?: string;
  // Email tracking velden (optioneel)
  toName?: string;
  content?: string;
  recipientsEmails?: string[];
  recipientsNames?: string[];
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
      error: 'Method not allowed. Only POST requests are supported.' 
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
    const { 
      to, 
      subject, 
      htmlBody, 
      textBody,
      paymentId,
      paymentUrl,
      paymentAmount,
      paymentDescription,
      toName,
      content,
      recipientsEmails,
      recipientsNames,
    }: EmailPayload = req.body;

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

    // Sla email op in Supabase sent_emails tabel (als payment info wordt meegegeven of als andere tracking velden worden meegegeven)
    if (paymentId || toName || content) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseServiceRoleKey) {
          const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
          
          const emailRecord: any = {
            to_email: to,
            to_name: toName || null,
            subject: subject,
            content: content || subject,
            html_content: htmlBody || null,
            recipients_count: recipientsEmails?.length || recipientsNames?.length || 1,
            recipients_emails: recipientsEmails || [to],
            recipients_names: recipientsNames || (toName ? [toName] : null),
            sent_at: new Date().toISOString(),
          };

          // Voeg payment tracking velden toe als ze worden meegegeven
          if (paymentId) {
            emailRecord.payment_id = paymentId;
            emailRecord.payment_status = 'open';
          }
          if (paymentUrl) {
            emailRecord.payment_url = paymentUrl;
          }
          if (paymentAmount !== undefined) {
            emailRecord.payment_amount = paymentAmount;
          }
          if (paymentDescription) {
            emailRecord.payment_description = paymentDescription;
          }

          const { error: insertError } = await supabaseClient
            .from('sent_emails')
            .insert(emailRecord);

          if (insertError) {
            console.error('Error saving email to database:', insertError);
            // Ga door, want email is al verstuurd
          } else {
            console.log('Email saved to sent_emails with payment tracking:', paymentId || 'no payment');
          }
        } else {
          console.warn('Supabase credentials not configured, skipping database save');
        }
      } catch (dbError: any) {
        console.error('Error saving email to database:', dbError);
        // Ga door, want email is al verstuurd
      }
    }

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
