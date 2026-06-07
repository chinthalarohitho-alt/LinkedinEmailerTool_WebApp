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
  // Never save linkedInCookie to disk
  const { linkedInCookie, ...safe } = settings;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(safe, null, 2));
}

// Get settings
router.get("/", (req, res) => {
  const settings = loadSettings();
  // Tell frontend if LinkedIn cookie is set (without revealing the value)
  settings.hasLinkedInCookie = !!req.cookies.li_at_token;
  res.json(settings);
});

// Update settings
router.put("/", (req, res) => {
  const { linkedInCookie, ...rest } = req.body;

  // Save non-sensitive settings to file
  const current = loadSettings();
  const updated = { ...current, ...rest };
  saveSettings(updated);

  // Store LinkedIn cookie as httpOnly browser cookie (can't be read by JS)
  if (linkedInCookie) {
    res.cookie("li_at_token", linkedInCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
  }

  res.json({ ...updated, hasLinkedInCookie: !!(linkedInCookie || req.cookies.li_at_token) });
});

// Clear LinkedIn cookie
router.delete("/linkedin-cookie", (req, res) => {
  res.clearCookie("li_at_token");
  res.json({ message: "LinkedIn cookie removed" });
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
