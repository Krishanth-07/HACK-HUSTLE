import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Landing from "./pages/Landing.jsx";
import ApplicationsPage from "./pages/ApplicationsPage.jsx";
import FairnessPage from "./pages/FairnessPage.jsx";
import AuditPage from "./pages/AuditPage.jsx";
import PredictionSandbox from "./pages/PredictionSandbox.jsx";
import ApplicantMessage from "./pages/ApplicantMessage.jsx";
import ModelCard from "./pages/ModelCard.jsx";
import SHAPExplanationPage from "./pages/SHAPExplanationPage.jsx";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Header />
      <div key={location.pathname} className="page-fade">
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<ApplicationsPage />} />
          <Route path="/applicant/:id" element={<ApplicantMessage />} />
          <Route path="/fairness" element={<FairnessPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/sandbox" element={<PredictionSandbox />} />
          <Route path="/explanation" element={<SHAPExplanationPage />} />
          <Route path="/model-card" element={<ModelCard />} />
        </Routes>
      </div>
    </div>
  );
}
