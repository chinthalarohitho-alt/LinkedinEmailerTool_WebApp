const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const TEMPLATE_PATH = path.join(__dirname, "../../Data/EmailTemplate.txt");
const SETTINGS_FILE = path.join(__dirname, "../../Data/settings.json");

function loadSettings() {
  const defaults = {
    searchRole: process.env.LINKEDIN_SEARCH_ROLE || "QA role",
    emailSubject:
      process.env.EMAIL_SUBJECT ||
      "Application - QA / Software Testing Role",
    emailUser: process.env.EMAIL_USER || "",
    emailPass: process.env.EMAIL_PASS || "",
    linkedInCookie: process.env.LINKEDIN_COOKIE || "",
  };

  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      return { ...defaults, ...saved };
    } catch (e) {}
  }
  return defaults;
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// Get settings
router.get("/", (req, res) => {
  res.json(loadSettings());
});

// Update settings
router.put("/", (req, res) => {
  const current = loadSettings();
  const updated = { ...current, ...req.body };
  saveSettings(updated);
  res.json(updated);
});

// Get email template
router.get("/template", (req, res) => {
  try {
    if (fs.existsSync(TEMPLATE_PATH)) {
      const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
      res.json({ template });
    } else {
      res.json({ template: "" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update email template
router.put("/template", (req, res) => {
  try {
    const { template } = req.body;
    const dir = path.dirname(TEMPLATE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TEMPLATE_PATH, template);
    res.json({ message: "Template saved", template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
