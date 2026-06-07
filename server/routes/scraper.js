const express = require("express");
const router = express.Router();
const scraperService = require("../services/ScraperService");

// SSE stream for real-time logs
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const onLog = (message) => {
    res.write(`data: ${JSON.stringify({ type: "log", message })}\n\n`);
  };

  const onStatusChange = () => {
    const status = scraperService.getStatus();
    res.write(`data: ${JSON.stringify({ type: "status", ...status })}\n\n`);
  };

  scraperService.on("log", onLog);

  // Send current status immediately
  onStatusChange();

  req.on("close", () => {
    scraperService.off("log", onLog);
  });
});

// Start scraping
router.post("/start", (req, res) => {
  const searchRole = req.body?.searchRole || req.cookies.search_role;
  const linkedInCookie = req.cookies.li_at_token;

  if (scraperService.status === "running") {
    return res.status(409).json({ error: "Scraper is already running" });
  }

  if (!linkedInCookie) {
    return res.status(400).json({ error: "LinkedIn cookie not set. Go to Settings and save your li_at cookie." });
  }

  // Start async — don't await
  scraperService.start({ searchRole, linkedInCookie }).catch(() => {});

  res.json({ message: "Scraper started", status: scraperService.getStatus() });
});

// Stop scraping
router.post("/stop", async (req, res) => {
  await scraperService.stop();
  res.json({ message: "Scraper stopped", status: scraperService.getStatus() });
});

// Get status
router.get("/status", (req, res) => {
  res.json(scraperService.getStatus());
});

module.exports = router;
