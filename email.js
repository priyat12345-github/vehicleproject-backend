// email.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config(); // Load EMAIL and EMAIL_PASSWORD from .env file

// 🧩 Create the transporter (the email-sending session)
const transporter = nodemailer.createTransport({
  service: "gmail", // Using Gmail's SMTP service
  auth: {
    user: process.env.EMAIL,          // your Gmail address
    pass: process.env.EMAIL_PASSWORD  // your 16-character App Password
  },
  pool: true,             // Keep a small connection pool for efficiency
  maxConnections: 5,      // At most 5 simultaneous SMTP connections
  maxMessages: 100        // Reuse connection for up to 100 messages
});

// 🧠 Verify the transporter (check connection on startup)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter ready to send messages");
  }
});

// 📩 Function to send email
export async function sendMail(to, subject, text, html = "") {
  const mailOptions = {
    from: process.env.EMAIL, // Sender address
    to,                      // Receiver address
    subject,                 // Email subject
    text,                    // Plain text version
    html                     // Optional HTML version
  };

  try {
    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // Log success
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Error sending email to ${to}:`, err.message);
    throw err;
  }
}
