import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppShell from "../AppShell.jsx";
import ApplicantMessage from "../ApplicantMessage.jsx";
import AuditLog from "../AuditLog.jsx";
import FairnessMonitor from "../FairnessMonitor.jsx";
import LoanOfficerCockpit from "../LoanOfficerCockpit.jsx";

import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LoanOfficerCockpit />} />
          <Route path="/applicant/:id" element={<ApplicantMessage />} />
          <Route path="/fairness" element={<FairnessMonitor />} />
          <Route path="/audit" element={<AuditLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
