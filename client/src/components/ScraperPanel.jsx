import { useState, useEffect, useRef } from "react";

export default function ScraperPanel() {
  const [status, setStatus] = useState("idle");
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({ searchRole: "QA role", headless: false });
  const logEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    // Load settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});

    // Load current status
    fetch("/api/scrape/status")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.status);
        setStats(data.stats);
      })
      .catch(() => {});

    // Connect SSE
    connectSSE();
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  const connectSSE = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();

    const es = new EventSource("/api/scrape/stream");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "log") {
        setLogs((prev) => [...prev, data.message]);
      } else if (data.type === "status") {
        setStatus(data.status);
        setStats(data.stats);
      }
    };

    es.onerror = () => {
      es.close();
      setTimeout(connectSSE, 3000);
    };
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleStart = async () => {
    setLogs([]);
    try {
      const res = await fetch("/api/scrape/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchRole: settings.searchRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("running");
      } else {
        setLogs((prev) => [...prev, `Error: ${data.error}`]);
      }
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${err.message}`]);
    }
  };

  const handleViewEmails = async () => {
    try {
      const res = await fetch("/api/emails");
      const data = await res.json();
      const emails = data.emails || [];
      const time = new Date().toLocaleTimeString();
      if (emails.length === 0) {
        setLogs((prev) => [...prev, `[${time}] No emails in queue.`]);
      } else {
        setLogs((prev) => [
          ...prev,
          `[${time}] --- Scraped Emails (${emails.length}) ---`,
          ...emails.map((e, i) => `  ${i + 1}. ${e}`),
          `[${time}] --- End of list ---`,
        ]);
      }
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${err.message}`]);
    }
  };

  const handleSendOnly = async () => {
    try {
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Sending emails only (no scraping)...`]);
      const res = await fetch("/api/emails/send", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (data.logs) data.logs.forEach((l) => setLogs((prev) => [...prev, l]));
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Done. Sent: ${data.sent}, Failed: ${data.failed}`]);
      } else {
        setLogs((prev) => [...prev, `Error: ${data.error}`]);
      }
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${err.message}`]);
    }
  };

  const handleStop = async () => {
    try {
      await fetch("/api/scrape/stop", { method: "POST" });
      setStatus("idle");
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${err.message}`]);
    }
  };

  const getLogClass = (line) => {
    if (line.includes("[FOUND]")) return "log-line found";
    if (line.includes("Error") || line.includes("FAILED")) return "log-line error";
    if (line.includes("SUCCESS") || line.includes("complete"))
      return "log-line success";
    return "log-line";
  };

  const badgeClass = {
    idle: "badge badge-gray",
    running: "badge badge-green",
    done: "badge badge-blue",
    error: "badge badge-red",
  };

  return (
    <div>
      <div className="section-header">
        <h2>LinkedIn Scraper</h2>
        <span className={badgeClass[status] || "badge badge-gray"}>
          {status}
        </span>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-label">New Emails Found</div>
          <div className="card-value">{stats.newEmails || 0}</div>
        </div>
        <div className="card">
          <div className="card-label">Total in Queue</div>
          <div className="card-value">{stats.totalEmails || 0}</div>
        </div>
        <div className="card">
          <div className="card-label">Cycles</div>
          <div className="card-value">{stats.cycles || 0}/25</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {status !== "running" ? (
          <button className="btn btn-primary" onClick={handleStart}>
            Start Scraping
          </button>
        ) : (
          <button className="btn btn-danger" onClick={handleStop}>
            Stop Scraping
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={handleViewEmails}
        >
          View Emails
        </button>
        <button
          className="btn btn-success"
          onClick={handleSendOnly}
          disabled={status === "running"}
        >
          Send Emails Only
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setLogs([])}
          disabled={logs.length === 0}
        >
          Clear Logs
        </button>
      </div>

      <div className="log-viewer">
        {logs.length === 0 ? (
          <div style={{ color: "#475569" }}>
            No logs yet. Click "Start Scraping" to begin.
          </div>
        ) : (
          logs.map((line, i) => (
            <div key={i} className={getLogClass(line)}>
              {line}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
