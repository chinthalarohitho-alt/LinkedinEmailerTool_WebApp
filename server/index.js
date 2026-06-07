const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const scraperRoutes = require("./routes/scraper");
const emailRoutes = require("./routes/emails");
const settingsRoutes = require("./routes/settings");
const authRoutes = require("./routes/auth");
const { authMiddleware } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers (CSP relaxed for self-hosted SPA)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Stricter for login attempts
  message: { error: "Too many login attempts, try again later." },
});

// CORS — same origin only (no external domains)
app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      // Allow same-origin requests (origin is undefined) and requests from the app itself
      if (!origin) return callback(null, true);
      const allowed = [
        `http://localhost:${PORT}`,
        "http://localhost:5173",
        process.env.RENDER_EXTERNAL_URL,
      ].filter(Boolean);
      if (allowed.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "1mb" })); // Limit body size
app.use(cookieParser());

// Auth routes (no auth required)
app.use("/api/auth", authLimiter, authRoutes);

// Health check (no auth required)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Protected API routes
app.use("/api/scrape", apiLimiter, authMiddleware, scraperRoutes);
app.use("/api/emails", apiLimiter, authMiddleware, emailRoutes);
app.use("/api/settings", apiLimiter, authMiddleware, settingsRoutes);

// Serve React build in production
const clientBuild = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuild));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(clientBuild, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
