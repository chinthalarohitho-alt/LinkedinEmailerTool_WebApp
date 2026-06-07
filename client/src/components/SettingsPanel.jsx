import { useState, useEffect } from "react";

export default function SettingsPanel() {
  const [settings, setSettings] = useState({
    searchRole: "",
    emailSubject: "",
    emailUser: "",
    emailPass: "",
  });
  const [linkedInCookie, setLinkedInCookie] = useState("");
  const [hasLinkedInCookie, setHasLinkedInCookie] = useState(false);
  const [template, setTemplate] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/settings/template").then((r) => r.json()),
    ])
      .then(([settingsData, templateData]) => {
        const { hasLinkedInCookie: hasCookie, ...rest } = settingsData;
        setSettings(rest);
        setHasLinkedInCookie(hasCookie);
        setTemplate(templateData.template || "");
      })
      .catch(() =>
        setMessage({ type: "error", text: "Failed to load settings" })
      );
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const body = { ...settings };
      if (linkedInCookie) {
        body.linkedInCookie = linkedInCookie;
      }

      const [settingsRes, templateRes] = await Promise.all([
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }),
        fetch("/api/settings/template", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template }),
        }),
      ]);

      if (settingsRes.ok && templateRes.ok) {
        const data = await settingsRes.json();
        setHasLinkedInCookie(data.hasLinkedInCookie);
        setLinkedInCookie("");
        setMessage({ type: "success", text: "All settings saved!" });
      } else {
        setMessage({ type: "error", text: "Failed to save some settings" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCookie = async () => {
    try {
      await fetch("/api/settings/linkedin-cookie", {
        method: "DELETE",
        credentials: "include",
      });
      setHasLinkedInCookie(false);
      setMessage({ type: "success", text: "LinkedIn cookie removed." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2>Settings</h2>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}

      <h3 style={{ fontSize: "1rem", marginBottom: 16, color: "#94a3b8" }}>LinkedIn</h3>

      <div className="form-group">
        <label>LinkedIn Search Role</label>
        <input
          type="text"
          value={settings.searchRole}
          onChange={(e) =>
            setSettings((s) => ({ ...s, searchRole: e.target.value }))
          }
          placeholder="e.g. QA role, SDET, Software Tester"
        />
      </div>

      <div className="form-group">
        <label>LinkedIn Cookie (li_at)</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="password"
            value={linkedInCookie}
            onChange={(e) => setLinkedInCookie(e.target.value)}
            placeholder={hasLinkedInCookie ? "Cookie is set (paste new to replace)" : "Paste your li_at cookie value here"}
            style={{ flex: 1 }}
          />
          {hasLinkedInCookie && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleRemoveCookie}
              style={{ whiteSpace: "nowrap" }}
            >
              Remove
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: hasLinkedInCookie ? "#22c55e" : "#ef4444",
            }}
          ></span>
          <span style={{ fontSize: "0.75rem", color: hasLinkedInCookie ? "#22c55e" : "#ef4444" }}>
            {hasLinkedInCookie ? "Cookie is securely stored" : "No cookie set"}
          </span>
        </div>
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
          How to get it: Open LinkedIn in Chrome &rarr; F12 &rarr; Application tab &rarr; Cookies &rarr; linkedin.com &rarr; copy the <strong>li_at</strong> value. Stored as httpOnly cookie (cannot be stolen by scripts).
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #334155", margin: "24px 0" }} />
      <h3 style={{ fontSize: "1rem", marginBottom: 16, color: "#94a3b8" }}>Email Credentials</h3>

      <div className="form-group">
        <label>Sender Email (Gmail)</label>
        <input
          type="email"
          value={settings.emailUser}
          onChange={(e) =>
            setSettings((s) => ({ ...s, emailUser: e.target.value }))
          }
          placeholder="your.email@gmail.com"
        />
      </div>

      <div className="form-group">
        <label>App Password</label>
        <input
          type="password"
          value={settings.emailPass}
          onChange={(e) =>
            setSettings((s) => ({ ...s, emailPass: e.target.value }))
          }
          placeholder="16-character Google App Password"
        />
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 6 }}>
          Generate an App Password from your Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords.
        </div>
      </div>

      <div className="form-group">
        <label>Email Subject</label>
        <input
          type="text"
          value={settings.emailSubject}
          onChange={(e) =>
            setSettings((s) => ({ ...s, emailSubject: e.target.value }))
          }
          placeholder="Application - QA / Software Testing Role"
        />
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #334155", margin: "24px 0" }} />
      <h3 style={{ fontSize: "1rem", marginBottom: 16, color: "#94a3b8" }}>Email Template</h3>

      <div className="form-group">
        <label>
          This text will be sent as the email body to all discovered addresses.
        </label>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="Write your email template here..."
          rows={12}
        />
      </div>
    </div>
  );
}
