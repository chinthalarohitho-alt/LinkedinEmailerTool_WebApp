const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");
const sentEmailManager = require("../../utils/SentEmailManager");

const DATA_DIR = path.join(__dirname, "../../Data");
const EMAILS_FILE_PATH = path.join(DATA_DIR, "Emails.txt");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

class ScraperService extends EventEmitter {
  constructor() {
    super();
    this.status = "idle"; // idle | running | done | error
    this.stats = { totalEmails: 0, newEmails: 0, cycles: 0 };
    this.browser = null;
    this.stopping = false;
  }

  log(message) {
    const line = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.emit("log", line);
  }

  _loadSettings() {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      }
    } catch (e) {}
    return {};
  }

  async start({ searchRole = "QA role" } = {}) {
    if (this.status === "running") {
      throw new Error("Scraper is already running");
    }

    this.status = "running";
    this.stopping = false;
    this.stats = { totalEmails: 0, newEmails: 0, cycles: 0 };

    try {
      await this._run(searchRole);
      this.status = this.stopping ? "idle" : "done";
    } catch (err) {
      this.status = "error";
      this.log(`Error: ${err.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }
    }
  }

  async stop() {
    if (this.status !== "running") return;
    this.stopping = true;
    this.log("Stop requested...");
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    this.status = "idle";
    this.log("Scraper stopped.");
  }

  async _run(searchRole) {
    const settings = this._loadSettings();
    const linkedInCookie = settings.linkedInCookie || process.env.LINKEDIN_COOKIE || "";

    if (!linkedInCookie) {
      throw new Error(
        "LinkedIn cookie (li_at) not configured. Go to Settings and paste your li_at cookie value."
      );
    }

    this.log("Launching headless browser...");

    this.browser = await chromium.launch({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    const context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    // Inject LinkedIn session cookie
    await context.addCookies([
      {
        name: "li_at",
        value: linkedInCookie,
        domain: ".linkedin.com",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "None",
      },
    ]);

    const page = await context.newPage();

    // 1. Verify session
    this.log("Checking LinkedIn session with cookie...");
    sentEmailManager.cleanup();

    await page.goto("https://www.linkedin.com/feed/", {
      waitUntil: "load",
      timeout: 30000,
    });

    if (page.url().includes("login") || page.url().includes("checkpoint")) {
      throw new Error(
        "LinkedIn cookie is invalid or expired. Please update your li_at cookie in Settings."
      );
    }

    this.log("Logged in successfully via cookie.");

    if (this.stopping) return;

    // 2. Search & filter
    const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(searchRole)}&datePosted=%5B%22past-24h%22%5D&origin=FACETED_SEARCH`;

    this.log(`Searching for: "${searchRole}" (Past 24h)...`);
    await page.goto(searchUrl, { waitUntil: "load" });
    await page
      .waitForSelector('[data-testid="lazy-column"]', { timeout: 15000 })
      .catch(() => {});
    await page.waitForTimeout(3000);

    // Close banners
    const mainDismiss = page
      .locator(
        'button[aria-label="Dismiss"], .artdeco-notification-badge__dismiss'
      )
      .first();
    if (await mainDismiss.isVisible()) {
      await mainDismiss.click({ force: true }).catch(() => {});
    }

    // 3. Extraction
    const discoveredEmails = new Set();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(EMAILS_FILE_PATH))
      fs.writeFileSync(EMAILS_FILE_PATH, "");

    fs.readFileSync(EMAILS_FILE_PATH, "utf-8")
      .split("\n")
      .forEach((e) => {
        if (e.trim()) discoveredEmails.add(e.trim());
      });

    this.stats.totalEmails = discoveredEmails.size;

    let lastProcessedIndex = 0;
    let idleCycles = 0;
    const MAX_IDLE_CYCLES = 5;

    for (let i = 0; i < 25; i++) {
      if (this.stopping) return;

      this.stats.cycles = i + 1;
      this.log(`--- Cycle ${i + 1}/25 ---`);

      const posts = page.locator(
        'div[data-testid="lazy-column"] > div div[role="listitem"]'
      );
      const currentCount = await posts.count();
      this.log(`Total posts visible: ${currentCount}`);

      let newEmailsInThisCycle = 0;

      for (let j = lastProcessedIndex; j < currentCount; j++) {
        if (this.stopping) return;

        const post = posts.nth(j);
        try {
          const moreBtn = post.locator(
            '[data-testid="expandable-text-button"]'
          );
          if ((await moreBtn.count()) > 0 && (await moreBtn.isVisible())) {
            await moreBtn.click({ force: true }).catch(() => {});
            await page.waitForTimeout(300);
          }
        } catch (e) {}

        const text = await post.innerText();
        const matches = text.match(emailRegex);
        if (matches) {
          matches.forEach((email) => {
            if (
              !discoveredEmails.has(email) &&
              !email.includes("example.com") &&
              !sentEmailManager.isAlreadySent(email)
            ) {
              this.log(`[FOUND] ${email}`);
              discoveredEmails.add(email);
              newEmailsInThisCycle++;
              this.stats.newEmails++;
              this.stats.totalEmails++;
              fs.appendFileSync(EMAILS_FILE_PATH, `${email}\n`);
            }
          });
        }
      }

      this.log(`New emails found in this cycle: ${newEmailsInThisCycle}`);
      lastProcessedIndex = currentCount;

      if (newEmailsInThisCycle === 0) {
        idleCycles++;
        this.log(
          `No new emails. Idle cycles: ${idleCycles}/${MAX_IDLE_CYCLES}`
        );
      } else {
        idleCycles = 0;
      }

      if (idleCycles >= MAX_IDLE_CYCLES) {
        this.log("Stopping: No new results found for several cycles.");
        break;
      }

      this.log("Scrolling for more content...");
      await page.evaluate(() => window.scrollBy(0, 2000));
      await page.waitForTimeout(4000);
    }

    this.log(
      `Scraping complete. Found ${this.stats.newEmails} new emails (${this.stats.totalEmails} total in queue).`
    );
  }

  getStatus() {
    return {
      status: this.status,
      stats: { ...this.stats },
    };
  }
}

module.exports = new ScraperService();
