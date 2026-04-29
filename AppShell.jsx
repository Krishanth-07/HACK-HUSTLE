import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

function formatClock(date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export default function AppShell() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="app-shell">
      <header className="global-header">
        <div className="brand-mark">VaazhlaiPartner | வாழ்லைபார்ட்னர்</div>
        <div className="system-title">கடன் முடிவு அமைப்பு / Credit Decision System</div>
        <div className="header-status">
          <span className="live-dot" aria-hidden="true" />
          <span>Live</span>
          <time>{formatClock(now)}</time>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
