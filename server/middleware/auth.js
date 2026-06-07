const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const AUTH_FILE = path.join(__dirname, "../../Data/auth.json");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function loadAuth() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      return JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
    }
  } catch (e) {}
  return null;
}

function saveAuth(data) {
  const dir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2));
}

function isSetup() {
  return !!loadAuth();
}

function verifyPassword(password) {
  const auth = loadAuth();
  if (!auth) return false;
  return auth.passwordHash === hashPassword(password);
}

function authMiddleware(req, res, next) {
  // If no password is set yet, allow access (first-time setup)
  if (!isSetup()) return next();

  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const auth = loadAuth();
  if (!auth || token !== auth.sessionToken) {
    return res.status(401).json({ error: "Invalid session" });
  }

  next();
}

module.exports = { hashPassword, loadAuth, saveAuth, isSetup, verifyPassword, authMiddleware };
