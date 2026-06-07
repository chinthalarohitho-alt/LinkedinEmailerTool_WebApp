const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const emailService = require("../services/EmailService");

const EMAILS_FILE_PATH = path.join(__dirname, "../../Data/Emails.txt");
const SENT_EMAILS_FILE = path.join(__dirname, "../../Data/SentEmails.json");

// Get queued emails
router.get("/", (req, res) => {
  try {
    if (!fs.existsSync(EMAILS_FILE_PATH)) {
      return res.json({ emails: [] });
    }
    const emails = fs
      .readFileSync(EMAILS_FILE_PATH, "utf-8")
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    res.json({ emails: [...new Set(emails)] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an email from queue
router.delete("/:email", (req, res) => {
  try {
    const emailToRemove = decodeURIComponent(req.params.email);
    if (!fs.existsSync(EMAILS_FILE_PATH)) {
      return res.status(404).json({ error: "No emails file" });
    }
    const currentData = fs.readFileSync(EMAILS_FILE_PATH, "utf-8");
    const updatedData = currentData
      .split("\n")
      .filter((line) => line.trim() !== emailToRemove)
      .join("\n");
    fs.writeFileSync(EMAILS_FILE_PATH, updatedData);
    res.json({ message: `Removed ${emailToRemove}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send all queued emails
router.post("/send", async (req, res) => {
  if (emailService.sending) {
    return res.status(409).json({ error: "Already sending emails" });
  }

  // Collect logs for the response
  const logs = [];
  const onLog = (msg) => logs.push(msg);
  emailService.on("log", onLog);

  try {
    const results = await emailService.sendAll({
      emailUser: req.cookies.email_user,
      emailPass: req.cookies.email_pass,
      emailSubject: req.cookies.email_subject,
      emailTemplate: req.cookies.email_template,
    });
    emailService.off("log", onLog);
    res.json({ ...results, logs });
  } catch (err) {
    emailService.off("log", onLog);
    res.status(500).json({ error: err.message, logs });
  }
});

// Get sent email history
router.get("/sent", (req, res) => {
  try {
    if (!fs.existsSync(SENT_EMAILS_FILE)) {
      return res.json({ sent: [] });
    }
    const data = JSON.parse(fs.readFileSync(SENT_EMAILS_FILE, "utf-8"));
    const sent = Object.entries(data).map(([email, timestamp]) => ({
      email,
      sentAt: new Date(timestamp).toISOString(),
      timestamp,
    }));
    sent.sort((a, b) => b.timestamp - a.timestamp);
    res.json({ sent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
