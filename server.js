// server.js
import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const upload = multer();

// ---------- CORS ----------
app.use(cors({
  origin: "https://skillvibe.co.uk" // replace with your Netlify URL
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- SMTP Transporter ----------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify SMTP connection
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP Connection Failed:", err);
  } else {
    console.log("✅ SMTP Connected Successfully");
  }
});

// ---------- Order Route ----------
app.post("/api/order", upload.single("file"), async (req, res) => {
  try {
    const { name, email, service, notes, customPlan, deadline } = req.body;
    const file = req.file;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Order from ${name}`,
      html: `
        <h2>New Order</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Service:</strong> ${service || "Not specified"}</p>
        <p><strong>Deadline:</strong> ${deadline || "N/A"}</p>
        <p><strong>Custom Plan:</strong> ${customPlan || "N/A"}</p>
        <p><strong>Notes:</strong> ${notes || "N/A"}</p>
      `,
      attachments: file ? [{ filename: file.originalname, content: file.buffer }] : []
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "Order submitted successfully" });
  } catch (error) {
    console.error("❌ Order Send Error:", error);
    return res.status(500).json({ error: "Failed to send order" });
  }
});

// ---------- Test route ----------
app.get("/", (req, res) => {
  res.send("SkillVibe Backend is running!");
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));