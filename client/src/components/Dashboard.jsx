import { useState, useEffect } from "react";

export default function Dashboard({ onNavigate }) {
  const [emails, setEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [scraperStatus, setScraperStatus] = useState("idle");
  const [stats, setStats] = useState({});
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchAll = async () => {
    try {
      const [emailsRes, sentRes, statusRes] = await Promise.all([
        fetch("/api/emails"),
        fetch("/api/emails/sent"),
        fetch("/api/scrape/status"),
      ]);
      const emailsData = await emailsRes.json();
      const sentData = await sentRes.json();
      const statusData = await statusRes.json();

      setEmails(emailsData.emails || []);
      setSentEmails(sentData.sent || []);
      setScraperStatus(statusData.status);
      setStats(statusData.stats);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (email) => {
    try {
      await fetch(`/api/emails/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      setEmails((prev) => prev.filter((e) => e !== email));
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleSendAll = async () => {
    if (
      !confirm(
        `Send emails to ${emails.length} recipient(s)? This will use your Gmail credentials.`
      )
    )
      return;

    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/emails/send", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Sent: ${data.sent}, Failed: ${data.failed}`,
        });
        fetchAll();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSending(false);
    }
  };

  const statusColor = {
    idle: "idle",
    running: "running",
    done: "done",
    error: "error",
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Dashboard</h2>

      {/* Stats Cards */}
      <div className="cards">
        <div className="card">
          <div className="card-label">Emails in Queue</div>
          <div className="card-value">{emails.length}</div>
        </div>
        <div className="card">
          <div className="card-label">Emails Sent</div>
          <div className="card-value">{sentEmails.length}</div>
        </div>
        <div className="card">
          <div className="card-label">Scraper Status</div>
          <div className={`card-value ${statusColor[scraperStatus]}`}>
            {scraperStatus}
          </div>
        </div>
        {scraperStatus === "running" && (
          <div className="card">
            <div className="card-label">Cycle</div>
            <div className="card-value">{stats.cycles || 0}/25</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions" style={{ marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={() => onNavigate("scraper")}>
          Start Scraping
        </button>
        <button
          className="btn btn-success"
          onClick={handleSendAll}
          disabled={sending || emails.length === 0}
        >
          {sending ? "Sending..." : `Send All (${emails.length})`}
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate("settings")}>
          Settings
        </button>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}

      {/* Email Queue */}
      <div className="section-header" style={{ marginTop: 8 }}>
        <h3>Email Queue ({emails.length})</h3>
      </div>

      {emails.length === 0 ? (
        <div className="empty">No emails in queue. Run the scraper to find emails.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Email Address</th>
                <th style={{ width: 80 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email, i) => (
                <tr key={email}>
                  <td>{i + 1}</td>
                  <td>{email}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(email)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sent History */}
      <div className="section-header" style={{ marginTop: 32 }}>
        <h3>Sent History ({sentEmails.length})</h3>
      </div>

      {sentEmails.length === 0 ? (
        <div className="empty">No emails have been sent yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Email Address</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {sentEmails.map((item, i) => (
                <tr key={item.email}>
                  <td>{i + 1}</td>
                  <td>{item.email}</td>
                  <td>{new Date(item.sentAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
