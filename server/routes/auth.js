const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { hashPassword, loadAuth, saveAuth, isSetup, verifyPassword } = require("../middleware/auth");

// Check if app needs setup (first-time password)
router.get("/status", (req, res) => {
  const setup = isSetup();
  const authenticated = !!req.cookies.auth_token && setup;

  if (authenticated) {
    const auth = loadAuth();
    if (!auth || req.cookies.auth_token !== auth.sessionToken) {
      return res.json({ setup, authenticated: false });
    }
  }

  res.json({ setup, authenticated: setup ? authenticated : true });
});

// Set password (first-time setup)
router.post("/setup", (req, res) => {
  if (isSetup()) {
    return res.status(400).json({ error: "Password already set. Use login instead." });
  }

  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  saveAuth({
    passwordHash: hashPassword(password),
    sessionToken,
  });

  res.cookie("auth_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.json({ message: "Password set successfully" });
});

// Login
router.post("/login", (req, res) => {
  const { password } = req.body;

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: "Wrong password" });
  }

  // Generate new session token on each login
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const auth = loadAuth();
  auth.sessionToken = sessionToken;
  saveAuth(auth);

  res.cookie("auth_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({ message: "Logged in" });
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.json({ message: "Logged out" });
});

module.exports = router;
