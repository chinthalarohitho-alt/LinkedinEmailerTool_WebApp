import { useState, useEffect } from "react";

export default function SentHistory() {
  const [sentEmails, setSentEmails] = useState([]);

  useEffect(() => {
    const fetchSent = async () => {
      try {
        const res = await fetch("/api/emails/sent");
        const data = await res.json();
        setSentEmails(data.sent || []);
      } catch (err) {
        console.error("Failed to fetch sent emails:", err);
      }
    };

    fetchSent();
    const interval = setInterval(fetchSent, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (iso) => {
    return new Date(iso).toLocaleString();
  };

  return (
    <div>
      <div className="section-header">
        <h2>Sent History ({sentEmails.length})</h2>
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
                  <td>{formatDate(item.sentAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
