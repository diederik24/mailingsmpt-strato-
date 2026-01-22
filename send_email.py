import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# SMTP Configuratie - gebruik environment variables voor veiligheid
SMTP_CONFIG = {
    'email': os.getenv('STRATO_EMAIL', 'info@manegeduiksehoef.nl'),
    'password': os.getenv('STRATO_PASSWORD', ''),  # MOET via environment variable
    'smtp_server': 'smtp.strato.com',
    'port_tls': 587,  # TLS poort (eerste keuze)
    'port_ssl': 465   # SSL poort (fallback)
}

def send_email(subject, body, to_email, is_html=False, save_to_sent=False, debug=False):
    """
    Verstuur een e-mail via SMTP met automatische fallback tussen TLS en SSL.
    
    Args:
        subject: Onderwerp van de e-mail
        body: Inhoud van de e-mail
        to_email: Ontvanger e-mailadres
        is_html: Als True, wordt body als HTML behandeld
        save_to_sent: Als True, stuur een BCC naar jezelf om in inbox/verstuurd te zien
        debug: Als True, toon debug informatie (alleen voor ontwikkeling)
    
    Returns:
        True als succesvol, False als gefaald
    """
    # Controleer of wachtwoord is ingesteld
    if not SMTP_CONFIG['password']:
        print("[FOUT] STRATO_PASSWORD environment variable is niet ingesteld!")
        print("   Gebruik: $env:STRATO_PASSWORD='jouw_wachtwoord' (PowerShell)")
        print("   Of: set STRATO_PASSWORD=jouw_wachtwoord (CMD)")
        return False
    
    msg = MIMEMultipart('alternative')
    msg['From'] = SMTP_CONFIG['email']
    msg['To'] = to_email
    msg['Reply-To'] = SMTP_CONFIG['email']
    msg['Subject'] = subject
    
    # Voeg BCC toe naar jezelf zodat je de e-mail terugziet in je webmail
    if save_to_sent:
        msg['Bcc'] = SMTP_CONFIG['email']
    
    # Voeg extra headers toe voor betere aflevering
    msg['Date'] = datetime.now().strftime('%a, %d %b %Y %H:%M:%S %z')
    msg['List-Unsubscribe'] = f'<mailto:{SMTP_CONFIG["email"]}?subject=unsubscribe>'
    msg['X-Mailer'] = 'Manege Duikse Hoef System'
    
    # Voeg body toe
    if is_html:
        msg.attach(MIMEText(body, 'html'))
    else:
        msg.attach(MIMEText(body, 'plain'))
    
    # Probeer eerst TLS (poort 587)
    try:
        if debug:
            print(f"Poging om verbinding te maken via TLS (poort {SMTP_CONFIG['port_tls']})...")
        server = smtplib.SMTP(SMTP_CONFIG['smtp_server'], SMTP_CONFIG['port_tls'])
        if debug:
            server.set_debuglevel(1)  # Debug mode alleen als gevraagd
        server.starttls()  # Start TLS encryptie
        server.login(SMTP_CONFIG['email'], SMTP_CONFIG['password'])
        
        # Stuur naar ontvanger en als BCC naar jezelf
        recipients = [to_email]
        if save_to_sent:
            recipients.append(SMTP_CONFIG['email'])
        result = server.send_message(msg, to_addrs=recipients)
        server.quit()
        print(f"[OK] E-mail succesvol verzonden via TLS naar {to_email}")
        return True
    
    except Exception as e:
        if debug:
            print(f"[FOUT] TLS verbinding gefaald: {str(e)}")
            print(f"Probeer nu SSL (poort {SMTP_CONFIG['port_ssl']})...")
        
        # Fallback naar SSL (poort 465)
        try:
            server = smtplib.SMTP_SSL(SMTP_CONFIG['smtp_server'], SMTP_CONFIG['port_ssl'])
            if debug:
                server.set_debuglevel(1)
            server.login(SMTP_CONFIG['email'], SMTP_CONFIG['password'])
            
            recipients = [to_email]
            if save_to_sent:
                recipients.append(SMTP_CONFIG['email'])
            result = server.send_message(msg, to_addrs=recipients)
            server.quit()
            print(f"[OK] E-mail succesvol verzonden via SSL naar {to_email}")
            return True
        
        except Exception as e2:
            print(f"[FOUT] E-mail verzenden gefaald: {str(e2)}")
            return False

def send_test_email(to_email=None, debug=False):
    """
    Verstuur een automatische testmail met de Manege Duikse Hoef layout.
    
    Args:
        to_email: Ontvanger e-mailadres (default: verstuur naar jezelf)
        debug: Als True, toon debug informatie
    """
    if to_email is None:
        to_email = SMTP_CONFIG['email']
    
    subject = "Testmail - E-mail configuratie"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    html_body = create_manege_email_template(
        title="Testmail - E-mail configuratie",
        greeting="Beste gebruiker,",
        content=f"""
            <p>Dit is een automatische testmail om te verifiëren dat de e-mail configuratie werkt.</p>
            
            <div class="login-info">
                <h3>Test informatie</h3>
                <p><strong>Verzonden op:</strong> {timestamp}</p>
                <p><strong>Van:</strong> {SMTP_CONFIG['email']}</p>
                <p><strong>Naar:</strong> {to_email}</p>
                <p><strong>SMTP Server:</strong> {SMTP_CONFIG['smtp_server']}</p>
            </div>
            
            <p>Als je deze e-mail ontvangt, werkt je e-mail configuratie correct!</p>
        """,
        show_button=False
    )
    
    text_body = f"""Testmail - E-mail configuratie

Beste gebruiker,

Dit is een automatische testmail om te verifiëren dat de e-mail configuratie werkt.

Verzonden op: {timestamp}
Van: {SMTP_CONFIG['email']}
Naar: {to_email}
SMTP Server: {SMTP_CONFIG['smtp_server']}

Als je deze e-mail ontvangt, werkt je e-mail configuratie correct!

Met vriendelijke groet,
Automatisch e-mailsysteem
"""
    
    print(f"\n{'='*60}")
    print("Automatische testmail versturen...")
    print(f"Van: {SMTP_CONFIG['email']}")
    print(f"Naar: {to_email}")
    print(f"Onderwerp: {subject}")
    print(f"{'='*60}\n")
    
    success = send_email(subject, html_body, to_email, is_html=True, save_to_sent=False, debug=debug)
    
    if success:
        print(f"\n[OK] Testmail is verzonden naar {to_email}")
        print("Controleer je inbox (en spam folder) om te bevestigen dat de mail is aangekomen.")
    else:
        print(f"\n[FOUT] Testmail verzenden is mislukt.")
    
    return success

def create_manege_email_template(title, greeting, content, button_text=None, button_url=None, show_button=True):
    """
    Maak een HTML e-mail template met de Manege Duikse Hoef layout.
    
    Args:
        title: Titel van de email (bijv. "Inloggegevens Webapp")
        greeting: Aanhef (bijv. "Beste Diederik,")
        content: HTML content voor de body
        button_text: Tekst voor de button (optioneel)
        button_url: URL voor de button (optioneel)
        show_button: Als True, toon button (standaard True)
    
    Returns:
        HTML string met de complete email template
    """
    button_html = ""
    if show_button and button_text and button_url:
        button_html = f'''
            <div style="text-align: center;">
                <a href="{button_url}" class="button">{button_text}</a>
            </div>
        '''
    
    html = f"""
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }}
        .container {{
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #E72D81;
        }}
        .header h1 {{
            color: #E72D81;
            margin: 0;
            font-size: 28px;
        }}
        .content {{
            margin-bottom: 30px;
        }}
        .content h2 {{
            color: #333;
            font-size: 20px;
            margin-top: 0;
        }}
        .content p {{
            color: #666;
            font-size: 16px;
            margin-bottom: 15px;
        }}
        .login-info {{
            background-color: #f9f9f9;
            border-left: 4px solid #E72D81;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }}
        .login-info h3 {{
            color: #E72D81;
            margin-top: 0;
            font-size: 18px;
        }}
        .login-info p {{
            margin: 5px 0;
            font-size: 14px;
        }}
        .password-box {{
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
        }}
        .payment-info {{
            background-color: #f9f9f9;
            border-left: 4px solid #E72D81;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }}
        .payment-amount {{
            font-size: 32px;
            font-weight: bold;
            color: #E72D81;
            margin: 15px 0;
        }}
        .button {{
            display: inline-block;
            background-color: #E72D81;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }}
        .button:hover {{
            background-color: #C2185B;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }}
        .steps {{
            margin: 20px 0;
        }}
        .steps ol {{
            padding-left: 20px;
        }}
        .steps li {{
            margin: 10px 0;
            color: #666;
        }}
        .warning-box {{
            margin-top: 15px;
            padding: 15px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐴 Manege Duikse Hoef</h1>
        </div>
        
        <div class="content">
            <h2>{title}</h2>
            
            <p>{greeting}</p>
            
            {content}
            
            {button_html}
            
            <p>Met vriendelijke groet,<br>
            Manege Duikse Hoef</p>
        </div>
        
        <div class="footer">
            <p>Manege Duikse Hoef<br>
            Duikse Hoef 1, 5175 PG Loon op Zand<br>
            <a href="mailto:{SMTP_CONFIG['email']}" style="color: #E72D81; text-decoration: none;">{SMTP_CONFIG['email']}</a> | +31 620685310</p>
        </div>
    </div>
</body>
</html>
"""
    return html

def send_html_email(to_email, subject, html_content, debug=False):
    """
    Verstuur een HTML e-mail met de Manege Duikse Hoef layout.
    
    Args:
        to_email: Ontvanger e-mailadres
        subject: Onderwerp van de e-mail
        html_content: HTML inhoud van de e-mail
        debug: Als True, toon debug informatie
    """
    print(f"\n{'='*60}")
    print("HTML e-mail versturen...")
    print(f"Van: {SMTP_CONFIG['email']}")
    print(f"Naar: {to_email}")
    print(f"Onderwerp: {subject}")
    print(f"{'='*60}\n")
    
    success = send_email(subject, html_content, to_email, is_html=True, save_to_sent=False, debug=debug)
    
    if success:
        print(f"\n[OK] HTML e-mail is verzonden naar {to_email}")
    else:
        print(f"\n[FOUT] HTML e-mail verzenden is mislukt.")
    
    return success

# Voorbeeld gebruik
if __name__ == "__main__":
    # Voor lokaal gebruik: zet environment variables
    # Windows PowerShell: $env:STRATO_PASSWORD="jouw_wachtwoord"
    # Windows CMD: set STRATO_PASSWORD=jouw_wachtwoord
    # Linux/Mac: export STRATO_PASSWORD="jouw_wachtwoord"
    
    # Als wachtwoord niet via environment variable is ingesteld, gebruik fallback
    # (alleen voor testen - verwijder dit in productie!)
    if not SMTP_CONFIG['password']:
        SMTP_CONFIG['password'] = 'Mee-hestar@2020'  # Fallback voor testen
    
    # Voorbeeld 1: Testmail versturen met Manege Duikse Hoef layout
    send_test_email("Diederik24@icloud.com", debug=True)
    
    # Voorbeeld 2: Inloggegevens email (uitgecommentarieerd)
    # html_body = create_manege_email_template(
    #     title="Inloggegevens Webapp",
    #     greeting="Beste Diederik,",
    #     content="""
    #         <p>Hier zijn de inloggegevens voor <strong>Ria Holt</strong> om door te sturen:</p>
    #         
    #         <div class="login-info">
    #             <h3>📱 Inloggegevens</h3>
    #             <p><strong>Klant:</strong> Ria Holt</p>
    #             <p><strong>Email:</strong> riaholt@planet.nl</p>
    #             <p><strong>Wachtwoord:</strong></p>
    #             <div class="password-box">CSX88G</div>
    #         </div>
    #         
    #         <div class="steps">
    #             <h3>Hoe log je in?</h3>
    #             <ol>
    #                 <li>Ga naar de webapp: <a href="https://manege-duikse-hoef.vercel.app">https://manege-duikse-hoef.vercel.app</a></li>
    #                 <li>Vul het email adres in: <strong>riaholt@planet.nl</strong></li>
    #                 <li>Vul het wachtwoord in: <strong>CSX88G</strong></li>
    #                 <li>Klik op "Inloggen"</li>
    #             </ol>
    #             <div class="warning-box">
    #                 <strong>💡 Tip:</strong> Het wachtwoord kan later worden gewijzigd in het profiel menu van de webapp.
    #             </div>
    #         </div>
    #     """,
    #     button_text="Ga naar de webapp",
    #     button_url="https://manege-duikse-hoef.vercel.app"
    # )
    # send_html_email("info@mee-hestar.nl", "Inloggegevens voor Ria Holt", html_body, debug=True)
    
    # Voorbeeld 3: Betaalverzoek email (uitgecommentarieerd)
    # html_body = create_manege_email_template(
    #     title="Betaalverzoek",
    #     greeting="Beste gebruiker,",
    #     content="""
    #         <p>U heeft een betaalverzoek ontvangen voor:</p>
    #         
    #         <div class="payment-info">
    #             <p><strong>Test betaalverzoek</strong></p>
    #             <div class="payment-amount">€ 0.01</div>
    #         </div>
    #     """,
    #     button_text="Betaal nu",
    #     button_url="https://example.com/payment"
    # )
    # send_html_email("info@mee-hestar.nl", "Betaalverzoek - Manege Duikse Hoef", html_body, debug=True)
