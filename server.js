import dotenv from "dotenv";
dotenv.config();

import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import multer from "multer";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Nodemailer transporter using port 587
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT), // 587
  secure: false, // false for STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify SMTP connection
transporter.verify((err, success) => {
  if (err) console.error("❌ SMTP Connection Failed:", err);
  else console.log("✅ SMTP Connected Successfully");
});

// -------------------------
// Order endpoint
// -------------------------
app.post("/send-email", upload.single("file"), async (req, res) => {
  try {
    const { name, email, service, notes, deadline, customPlan } = req.body;

    // Free Demo: send email immediately
    if (service === "demo") {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `New Free Demo Request from ${name}`,
        html: `
          <h2>New Free Demo Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Notes:</strong> ${notes || "None"}</p>
        `,
      };

      // Attach uploaded file if exists
      if (req.file) {
        mailOptions.attachments = [
          {
            filename: req.file.originalname,
            path: req.file.path,
          },
        ];
      }

      await transporter.sendMail(mailOptions);

      // Delete uploaded file from server
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("❌ Failed to delete uploaded file:", err);
        });
      }

      return res.json({ success: true, message: "Demo request sent successfully!" });
    }

    // Paid plans: pending payment (Stripe integration later)
    return res.json({
      success: true,
      message: "Order received. Please complete the payment to proceed.",
    });
  } catch (error) {
    console.error("❌ Email Send Error:", error);
    return res.status(500).json({ error: "Failed to process order" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));