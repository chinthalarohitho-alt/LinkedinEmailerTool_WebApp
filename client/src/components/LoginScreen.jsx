import { useState } from "react";

export default function LoginScreen({ onAuth }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSetup, setIsSetup] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if this is first-time setup or login
  useState(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          onAuth();
        } else {
          setIsSetup(data.setup);
        }
      })
      .catch(() => setIsSetup(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isSetup ? "/api/auth/login" : "/api/auth/setup";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        onAuth();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  if (isSetup === null) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          borderRadius: 12,
          padding: 32,
          width: "100%",
          maxWidth: 400,
        }}
      >
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#f8fafc",
            marginBottom: 8,
          }}
        >
          LinkedIn Emailer Tool
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#64748b",
            marginBottom: 24,
          }}
        >
          {isSetup
            ? "Enter your password to continue."
            : "Set a password to protect your app (first-time setup)."}
        </p>

        {error && (
          <div className="message message-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{isSetup ? "Password" : "Create Password (min 6 chars)"}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              minLength={6}
              required
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading
              ? "Please wait..."
              : isSetup
              ? "Login"
              : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
