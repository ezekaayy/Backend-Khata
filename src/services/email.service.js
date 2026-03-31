require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error("Error connecting to email server:", error);
    } else {
        console.log("Email server is ready to send messages");
    }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
        });

        console.log("Message sent: %s", info.messageId);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("Preview URL: %s", previewUrl);
        } 
        // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

async function sendRegisterationEmail(userEmail, name) {
    const subject = "welcome to Backend Ledger!";
    const text = `
Welcome to Backend Ledger!

Hi ${name},

Your account has been successfully created.

You can now securely access your account and explore the platform.

If this wasn’t you, please ignore this email.

– Backend Ledger Team
`;


    const html = `
<div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
  <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
    
    <h2 style="margin: 0 0 10px; color: #111827;">
      Welcome, ${name}! 🎉
    </h2>

    <p style="color: #4b5563; font-size: 14px;">
      Your account has been successfully created.
    </p>

    <p style="color: #4b5563; font-size: 14px;">
      You can now securely access your account and get started.
    </p>

    <div style="margin: 20px 0;">
      <a href="#" 
         style="display: inline-block; padding: 10px 16px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px;">
        Go to Dashboard
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px;">
      If this wasn’t you, please ignore this email.
    </p>

    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
      – Backend Ledger Team
    </p>

  </div>
</div>
`;
    await sendEmail(userEmail, subject, text, html);
}

module.exports = { sendRegisterationEmail };


