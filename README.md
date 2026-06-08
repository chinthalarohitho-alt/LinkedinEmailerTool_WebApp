# LinkedIn Scrapper Tool

A web-based tool that scrapes LinkedIn posts for job opportunities, extracts recruiter email addresses, and automatically sends personalized application emails with your resume attached.

Built with **React** + **Express** + **Playwright** + **Nodemailer** + **Google Gemini AI**.

## Features

- **LinkedIn Scraper** — Headless Chrome scrapes LinkedIn search results for email addresses in posts
- **AI Email Generator** — Uses Google Gemini to generate personalized cold emails from your resume
- **Auto-Send** — Automatically sends emails to all new addresses found after scraping
- **Cron Scheduler** — Schedule automatic scraping at intervals (every X hours, specific days/months)
- **Dashboard** — View email queue, sent history, scraper status with real-time progress bars
- **Dark / Light Theme** — Toggle between themes, persisted across sessions
- **Resume Upload** — Upload your PDF resume directly from the Settings UI
- **Cross-Platform** — Works on macOS and Windows with one-click launchers

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Google Chrome](https://www.google.com/chrome/) installed
- Gmail account with [App Password](https://myaccount.google.com/apppasswords) (2FA must be enabled)
- [Gemini API Key](https://aistudio.google.com/apikey) (free, for AI email generation)

## Quick Start

### Option 1: Double-click launcher

| OS      | File                              |
|---------|-----------------------------------|
| macOS   | `Click Me to Start (Mac).command` |
| Windows | `Click Me to Start (Windows).bat` |

Double-click the file. It installs dependencies if needed, starts the app, and opens your browser.

### Option 2: Terminal

```bash
npm install && npm install --prefix client
npm run dev
```

Open `http://localhost:5173` in your browser.

## Stopping the App

- Press `Ctrl + C` in the terminal, or close the terminal window.

## First Run Guide

1. **Settings** — Enter your Gmail address, App Password, and select a search role
2. **Resume & Profile** — Upload your resume PDF, add phone number and LinkedIn username
3. **AI Template** — Paste your free [Gemini API key](https://aistudio.google.com/apikey), then click **Generate with AI** to create a personalized email template
4. **Scraper** — Click **Start Scraping**. On first run, a Chrome window opens for LinkedIn login. Log in manually — your session is saved for future headless runs
5. **Dashboard** — View scraped emails, send them individually or in bulk
6. **Cron Job** — Optionally schedule automatic scraping at your preferred intervals

## Project Structure

```
LinkedinEmailerTool/
├── client/                 # React frontend (Vite)
│   └── src/components/     # Dashboard, Scraper, Settings, CronPanel
├── server/                 # Express backend
│   ├── routes/             # API endpoints (scraper, emails, settings, cron)
│   ├── services/           # ScraperService, EmailService, CronService
│   └── lib/                # Shared config and utilities
├── utils/                  # SentEmailManager (dedup tracker)
├── Data/                   # Runtime data (emails, settings, Chrome profile)
└── Click Me to Start.*     # One-click launchers
```

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React, Vite, CSS Variables |
| Backend  | Express.js, Node.js |
| Scraping | Playwright (persistent Chrome) |
| Email    | Nodemailer (Gmail SMTP) |
| AI       | Google Gemini 2.5 Flash |
| Cron     | node-cron |

## Contact

For queries or support, reach out at **chinthalarohitho@gmail.com**.
