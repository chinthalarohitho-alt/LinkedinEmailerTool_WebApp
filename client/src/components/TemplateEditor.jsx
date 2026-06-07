import { useState, useEffect } from "react";

export default function TemplateEditor() {
  const [template, setTemplate] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/template")
      .then((r) => r.json())
      .then((data) => setTemplate(data.template || ""))
      .catch((err) =>
        setMessage({ type: "error", text: "Failed to load template" })
      );
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Template saved!" });
      } else {
        setMessage({ type: "error", text: "Failed to save template" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2>Email Template</h2>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Template"}
        </button>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}

      <div className="form-group">
        <label>
          This text will be sent as the email body to all discovered addresses.
        </label>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="Write your email template here..."
          rows={15}
        />
      </div>

      <div
        style={{
          fontSize: "0.75rem",
          color: "#64748b",
        }}
      >
        Tip: The template is saved to Data/EmailTemplate.txt and will be used
        for all outgoing emails.
      </div>
    </div>
  );
}
