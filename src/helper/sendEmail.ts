import nodemailer from "nodemailer";

async function sendEmail({
  to,
  subject,
  content,
}: {
  to: string;
  subject: string;
  content: string;
}): Promise<void> {
  const email = process.env.EMAIL_ADDRESS;
  const password = process.env.EMAIL_PASSWORD;

  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: email,
      pass: password,
    },
  });

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #ffffff !important;
                color: #000000 !important;
                width: 100vw;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff !important;
            }
            .header {
                background-color: #041d28 !important;
                text-align: center;
                padding: 20px;
            }
            .header img {
                width: 100%;
                max-width: 300px;
            }
            .content {
                padding: 20px;
                text-align: center;
            }
            .footer {
                background-color: #041d28 !important;
                color: white !important;
                text-align: center;
                padding: 20px;
            }
            .footer p {
                margin: 5px 0;
            }
            .footer a {
                color: white !important;
                text-decoration: none;
            }
            .footer-icons {
                margin: 10px 0;
            }
            .footer-icons img {
                margin: 0 5px;
            }
            p {
                text-align: start;
            }

            /* Dark mode styles */
            @media (prefers-color-scheme: dark) {
                body, .container {
                    background-color: #ffffff !important;
                }
                .header {
                    background-color: #041d28 !important;
                }
                .footer {
                    background-color: #041d28 !important;
                    color: white !important;
                }
                .footer a {
                    color: white !important;
                }
            }

            /* Light mode styles */
            @media (prefers-color-scheme: light) {
                body, .container {
                    background-color: #ffffff !important;
                }
                .header {
                    background-color: #041d28 !important;
                }
                .footer {
                    background-color: #041d28 !important;
                    color: white !important;
                }
                .footer a {
                    color: white !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://cmmg.vercel.app/logo.png" alt="CMMG Workstation" />
            </div>
            <div class="content">
                <!-- Content goes here -->
                <p>${content}</p>
            </div>
            <div class="footer">
                <div class="footer-icons">
                    
                </div>
                <p>Mail: <a href="mailto:soporte@cmmg.es">soporte@cmmg.es</a></p>
                <p>WhatsApp: +34 666 590 158</p>
            </div>
        </div>
    </body>
    </html>
    `;

  const info = await transporter.sendMail({
    from: `"CMMG Workstation" <${email}>`,
    to: to,
    subject: subject,
    html: htmlTemplate
  });

}

export default sendEmail;
