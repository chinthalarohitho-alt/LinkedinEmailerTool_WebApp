import { useState, useEffect } from "react";

export default function SettingsPanel() {
  const [settings, setSettings] = useState({
    searchRole: "",
    emailSubject: "",
  });
  const [linkedInCookie, setLinkedInCookie] = useState("");
  const [emailUser, setEmailUser] = useState("");
  const [emailPass, setEmailPass] = useState("");
  const [has, setHas] = useState({ linkedInCookie: false, emailUser: false, emailPass: false });
  const [template, setTemplate] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/settings/template").then((r) => r.json()),
    ])
      .then(([settingsData, templateData]) => {
        const { hasLinkedInCookie, hasEmailUser, hasEmailPass, ...rest } = settingsData;
        setSettings(rest);
        setHas({ linkedInCookie: hasLinkedInCookie, emailUser: hasEmailUser, emailPass: hasEmailPass });
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
      if (linkedInCookie) body.linkedInCookie = linkedInCookie;
      if (emailUser) body.emailUser = emailUser;
      if (emailPass) body.emailPass = emailPass;

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
        setHas({
          linkedInCookie: data.hasLinkedInCookie,
          emailUser: data.hasEmailUser,
          emailPass: data.hasEmailPass,
        });
        setLinkedInCookie("");
        setEmailUser("");
        setEmailPass("");
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

  const handleClearCredentials = async () => {
    try {
      await fetch("/api/settings/credentials", {
        method: "DELETE",
        credentials: "include",
      });
      setHas({ linkedInCookie: false, emailUser: false, emailPass: false });
      setMessage({ type: "success", text: "All credentials removed." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const StatusDot = ({ active }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: active ? "#22c55e" : "#ef4444", marginTop: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? "#22c55e" : "#ef4444" }}></span>
      {active ? "Set" : "Not set"}
    </span>
  );

  return (
    <div>
      <div className="section-header">
        <h2>Settings</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-danger btn-sm" onClick={handleClearCredentials}>
            Clear All Credentials
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
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
          onChange={(e) => setSettings((s) => ({ ...s, searchRole: e.target.value }))}
          placeholder="e.g. QA role, SDET, Software Tester"
        />
      </div>

      <div className="form-group">
        <label>LinkedIn Cookie (li_at)</label>
        <input
          type="password"
          value={linkedInCookie}
          onChange={(e) => setLinkedInCookie(e.target.value)}
          placeholder={has.linkedInCookie ? "Cookie is set (paste new to replace)" : "Paste your li_at cookie value"}
        />
        <StatusDot active={has.linkedInCookie} />
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
          Chrome &rarr; F12 &rarr; Application &rarr; Cookies &rarr; linkedin.com &rarr; <strong>li_at</strong>. Stored securely in your browser only.
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #334155", margin: "24px 0" }} />
      <h3 style={{ fontSize: "1rem", marginBottom: 16, color: "#94a3b8" }}>Email Credentials</h3>

      <div className="form-group">
        <label>Sender Email (Gmail)</label>
        <input
          type="password"
          value={emailUser}
          onChange={(e) => setEmailUser(e.target.value)}
          placeholder={has.emailUser ? "Email is set (type new to replace)" : "your.email@gmail.com"}
        />
        <StatusDot active={has.emailUser} />
      </div>

      <div className="form-group">
        <label>App Password</label>
        <input
          type="password"
          value={emailPass}
          onChange={(e) => setEmailPass(e.target.value)}
          placeholder={has.emailPass ? "Password is set (type new to replace)" : "16-character Google App Password"}
        />
        <StatusDot active={has.emailPass} />
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
          Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords. Stored securely in your browser only.
        </div>
      </div>

      <div className="form-group">
        <label>Email Subject</label>
        <input
          type="text"
          value={settings.emailSubject}
          onChange={(e) => setSettings((s) => ({ ...s, emailSubject: e.target.value }))}
          placeholder="Application - QA / Software Testing Role"
        />
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #334155", margin: "24px 0" }} />
      <h3 style={{ fontSize: "1rem", marginBottom: 16, color: "#94a3b8" }}>Email Template</h3>

      <div className="form-group">
        <label>This text will be sent as the email body to all discovered addresses.</label>
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
