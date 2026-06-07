import { useState, useEffect } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import ScraperPanel from "./components/ScraperPanel";
import SettingsPanel from "./components/SettingsPanel";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "scraper", label: "Scraper" },
  { id: "settings", label: "Settings" },
];

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setAuthenticated(data.authenticated);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setAuthenticated(false);
  };

  if (checking) return null;

  if (!authenticated) {
    return <LoginScreen onAuth={() => setAuthenticated(true)} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "scraper":
        return <ScraperPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ marginBottom: 0 }}>LinkedIn Emailer Tool</h1>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <nav className="tab-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">{renderTab()}</main>
    </div>
  );
}
