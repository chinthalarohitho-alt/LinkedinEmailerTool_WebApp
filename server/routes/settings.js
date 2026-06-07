const express = require("express");
const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
};

// All settings stored as browser cookies — nothing on server disk

// Get settings (read from cookies)
router.get("/", (req, res) => {
  res.json({
    searchRole: req.cookies.search_role || process.env.LINKEDIN_SEARCH_ROLE || "QA role",
    emailSubject: req.cookies.email_subject || process.env.EMAIL_SUBJECT || "Application - QA / Software Testing Role",
    hasLinkedInCookie: !!req.cookies.li_at_token,
    hasEmailUser: !!req.cookies.email_user,
    hasEmailPass: !!req.cookies.email_pass,
    hasTemplate: !!req.cookies.email_template,
  });
});

// Update settings (save to cookies)
router.put("/", (req, res) => {
  const { linkedInCookie, emailUser, emailPass, searchRole, emailSubject } = req.body;

  if (searchRole) res.cookie("search_role", searchRole, COOKIE_OPTS);
  if (emailSubject) res.cookie("email_subject", emailSubject, COOKIE_OPTS);
  if (linkedInCookie) res.cookie("li_at_token", linkedInCookie, COOKIE_OPTS);
  if (emailUser) res.cookie("email_user", emailUser, COOKIE_OPTS);
  if (emailPass) res.cookie("email_pass", emailPass, COOKIE_OPTS);

  res.json({
    searchRole: searchRole || req.cookies.search_role || "QA role",
    emailSubject: emailSubject || req.cookies.email_subject || "",
    hasLinkedInCookie: !!(linkedInCookie || req.cookies.li_at_token),
    hasEmailUser: !!(emailUser || req.cookies.email_user),
    hasEmailPass: !!(emailPass || req.cookies.email_pass),
    hasTemplate: !!req.cookies.email_template,
  });
});

// Clear all credentials
router.delete("/credentials", (req, res) => {
  res.clearCookie("li_at_token");
  res.clearCookie("email_user");
  res.clearCookie("email_pass");
  res.clearCookie("search_role");
  res.clearCookie("email_subject");
  res.clearCookie("email_template");
  res.json({ message: "All credentials and settings removed" });
});

// Get email template (from cookie)
router.get("/template", (req, res) => {
  const template = req.cookies.email_template || "";
  res.json({ template });
});

// Update email template (save to cookie)
router.put("/template", (req, res) => {
  const { template } = req.body;
  if (template !== undefined) {
    res.cookie("email_template", template, COOKIE_OPTS);
  }
  res.json({ message: "Template saved", template });
});

module.exports = router;
