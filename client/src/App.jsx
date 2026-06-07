import { useState } from "react";
import Dashboard from "./components/Dashboard";
import ScraperPanel from "./components/ScraperPanel";
import SettingsPanel from "./components/SettingsPanel";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "scraper", label: "Scraper" },
  { id: "settings", label: "Settings" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

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
        <h1>LinkedIn Emailer Tool</h1>
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
