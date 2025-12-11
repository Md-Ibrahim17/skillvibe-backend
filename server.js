import dotenv from "dotenv";
dotenv.config();

import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------
//  SMTP Transporter (Zoho EU)
// ------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // smtppro.zoho.eu
  port: parseInt(process.env.SMTP_PORT), // 465
  secure: true,
  auth: {
    user: process.env.SMTP_USER,    // contact@skillvibe.co.uk
    pass: process.env.SMTP_PASS     // 12 character app password
  }
});

// Verify SMTP Connection
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP Connection Failed:", err);
  } else {
    console.log("✅ SMTP Connected Successfully");
  }
});

app.post("/send-email", async (req, res) => {
  try {
    const { name, email, message, service } = req.body;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Message from ${name}`,
      html: `
        <h2>New Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Service:</strong> ${service || "Not specified"}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "Email sent successfully" });

  } catch (error) {
    console.error("❌ Email Send Error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));