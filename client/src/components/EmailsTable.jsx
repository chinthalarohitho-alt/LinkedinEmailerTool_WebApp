import { useState, useEffect } from "react";

export default function EmailsTable() {
  const [emails, setEmails] = useState([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchEmails = async () => {
    try {
      const res = await fetch("/api/emails");
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 5000);
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
    ) {
      return;
    }

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
        fetchEmails();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2>Email Queue ({emails.length})</h2>
        <button
          className="btn btn-success"
          onClick={handleSendAll}
          disabled={sending || emails.length === 0}
        >
          {sending ? "Sending..." : "Send All"}
        </button>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}

      {emails.length === 0 ? (
        <div className="empty">
          No emails in queue. Run the scraper to find emails.
        </div>
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
    </div>
  );
}
