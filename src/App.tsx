import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { StandaloneChat } from './pages/StandaloneChat';
import { Settings } from './pages/Settings';
import { AutoScoutPage } from './components/AutoScoutPage';
import { AppShell } from './components/layout/AppShell';

function AutoScoutRoute() {
  return (
    <AppShell showProjectContext={false}>
      <AutoScoutPage />
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default to chat - no project required */}
        <Route path="/" element={<Navigate to="/chat" />} />
        <Route path="/chat" element={<StandaloneChat />} />
        <Route path="/chat/:huntId" element={<StandaloneChat />} />
        <Route path="/projects" element={<Onboarding />} />
        <Route path="/projects/:projectId/*" element={<Dashboard />} />
        <Route path="/projects/:projectId/auto-scout" element={<AutoScoutRoute />} />
        <Route path="/auto-scout" element={<AutoScoutRoute />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
