const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const scraperRoutes = require("./routes/scraper");
const emailRoutes = require("./routes/emails");
const settingsRoutes = require("./routes/settings");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/scrape", scraperRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/settings", settingsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Serve React build in production
const clientBuild = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuild));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(clientBuild, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
