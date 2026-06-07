const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");
const sentEmailManager = require("../../utils/SentEmailManager");

const DATA_DIR = path.join(__dirname, "../../Data");
const EMAILS_FILE_PATH = path.join(DATA_DIR, "Emails.txt");
const TEMPLATE_PATH = path.join(DATA_DIR, "EmailTemplate.txt");

class EmailService extends EventEmitter {
  constructor() {
    super();
    this.sending = false;
  }

  log(message) {
    const line = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.emit("log", line);
  }

  _discoverResume() {
    let resumePath = path.join(DATA_DIR, "sdet.pdf");
    try {
      if (fs.existsSync(DATA_DIR)) {
        const files = fs.readdirSync(DATA_DIR);
        const resumeFile = files.find((f) => /resume\.pdf$/i.test(f));
        if (resumeFile) {
          resumePath = path.join(DATA_DIR, resumeFile);
        }
      }
    } catch (err) {}
    return resumePath;
  }

  async sendAll() {
    if (this.sending) {
      throw new Error("Already sending emails");
    }

    this.sending = true;
    const results = { sent: 0, failed: 0, total: 0 };

    try {
      // Load credentials from settings file, fall back to .env
      const settingsFile = path.join(DATA_DIR, "settings.json");
      let savedSettings = {};
      try {
        if (fs.existsSync(settingsFile)) {
          savedSettings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
        }
      } catch (e) {}

      const user = savedSettings.emailUser || process.env.EMAIL_USER;
      const pass = savedSettings.emailPass || process.env.EMAIL_PASS;

      if (!user || !pass || pass === "your_google_app_password_here") {
        throw new Error(
          "Sender email or app password not configured. Go to Settings to set them."
        );
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
      });

      if (!fs.existsSync(EMAILS_FILE_PATH)) {
        this.log("No emails file found.");
        return results;
      }

      const rawEmails = fs
        .readFileSync(EMAILS_FILE_PATH, "utf-8")
        .split("\n")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const uniqueEmails = [...new Set(rawEmails)];
      results.total = uniqueEmails.length;

      if (uniqueEmails.length === 0) {
        this.log("No emails to send.");
        return results;
      }

      // Load template
      let body = "";
      if (fs.existsSync(TEMPLATE_PATH)) {
        body = fs.readFileSync(TEMPLATE_PATH, "utf-8");
      } else {
        body = (process.env.EMAIL_BODY || "").replace(/\\n/g, "\n");
      }

      const subject =
        savedSettings.emailSubject ||
        process.env.EMAIL_SUBJECT ||
        "Application - QA / Software Testing Role";
      const resumePath = this._discoverResume();

      this.log(`Sending ${uniqueEmails.length} emails...`);

      for (const email of uniqueEmails) {
        this.log(`Sending to: ${email}...`);

        const mailOptions = {
          from: user,
          to: email,
          subject,
          text: body,
          attachments: [
            {
              filename: path.basename(resumePath),
              path: resumePath,
            },
          ],
        };

        try {
          await transporter.sendMail(mailOptions);
          this.log(`SUCCESS: Sent to ${email}`);
          results.sent++;

          sentEmailManager.addEmail(email);

          // Remove from queue
          const currentData = fs.readFileSync(EMAILS_FILE_PATH, "utf-8");
          const updatedData = currentData
            .split("\n")
            .filter((line) => line.trim() !== email)
            .join("\n");
          fs.writeFileSync(EMAILS_FILE_PATH, updatedData);
        } catch (error) {
          this.log(`FAILED: ${email} - ${error.message}`);
          results.failed++;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      this.log(
        `Done. Sent: ${results.sent}, Failed: ${results.failed}`
      );
      return results;
    } finally {
      this.sending = false;
    }
  }
}

module.exports = new EmailService();
