import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { applySettings } from './platform/feedback';
import { MotionProvider } from './platform/MotionContext';
import { useData } from './state/store';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { SimPanel } from './ui/components/SimPanel';
import { About } from './ui/screens/About';
import { ClinicianHome } from './ui/screens/clinician/ClinicianHome';
import { Exam } from './ui/screens/clinician/Exam';
import { EpisodeFlow } from './ui/screens/patient/EpisodeFlow';
import { EpisodeReport, History } from './ui/screens/patient/History';
import { Onboarding } from './ui/screens/patient/Onboarding';
import { PatientHome } from './ui/screens/patient/PatientHome';
import { PrescriptionImport } from './ui/screens/patient/PrescriptionImport';
import { Settings } from './ui/screens/Settings';
import { Welcome } from './ui/screens/Welcome';

function Root() {
  const { settings } = useData();
  if (settings.role === 'patient') return <Navigate to="/hasta" replace />;
  if (settings.role === 'clinician') return <Navigate to="/odyolog" replace />;
  return <Welcome />;
}

export function App() {
  const { settings } = useData();

  useEffect(() => {
    const el = document.documentElement;
    if (settings.theme === 'auto') delete el.dataset.theme;
    else el.dataset.theme = settings.theme;
    if (settings.fontScale === 'normal') delete el.dataset.font;
    else el.dataset.font = settings.fontScale;
    applySettings(settings);
  }, [settings]);

  return (
    <ErrorBoundary>
    <MotionProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/hasta" element={<PatientHome />} />
          <Route path="/hasta/kurulum" element={<Onboarding />} />
          <Route path="/hasta/atak/:mode" element={<EpisodeFlow />} />
          <Route path="/hasta/gecmis" element={<History />} />
          <Route path="/hasta/rapor/:id" element={<EpisodeReport />} />
          <Route path="/odyolog" element={<ClinicianHome />} />
          <Route path="/odyolog/muayene/:id" element={<Exam />} />
          <Route path="/recete/:token" element={<PrescriptionImport />} />
          <Route path="/ayarlar" element={<Settings />} />
          <Route path="/hakkinda" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <SimPanel />
    </MotionProvider>
    </ErrorBoundary>
  );
}
