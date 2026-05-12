import { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { AppShell } from '../components/layout';
import { Chat } from '../components/Chat';
import { ManualAnalyzer } from '../components/ManualAnalyzer';
import { MoodBoard } from '../components/MoodBoard';
import { DailyFinds } from '../components/DailyFinds';
import { AutoScoutSettings } from '../components/AutoScoutSettings';

interface Project {
  id: string;
  name: string;
  description?: string;
  default_max_price: number;
}

export function Dashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeHuntId, setActiveHuntId] = useState<string | undefined>();

  // Sidebar is always visible now (ChatGPT-style)
  const showSidebar = true;

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => {
        const current = data.find((p: Project) => p.id === projectId);
        if (current) setProject(current);
        else navigate('/projects');
      });
  }, [projectId, navigate]);

  const handleSelectHunt = (huntId: string) => {
    setActiveHuntId(huntId);
    // TODO: Load hunt messages and switch to that hunt's chat
  };

  const handleNewHunt = async (huntProjectId?: string) => {
    try {
      const res = await fetch('/api/hunts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New hunt',
          project_id: huntProjectId || projectId
        })
      });
      const hunt = await res.json();
      setActiveHuntId(hunt.id);
    } catch (err) {
      console.error('Failed to create hunt:', err);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="animate-pulse-dot inline-block w-2 h-2 rounded-full mb-4" style={{ background: 'var(--color-gold)' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      projectId={projectId}
      projectName={project.name}
      projectBudget={project.default_max_price}
      isSearching={isSearching}
      showHuntsSidebar={showSidebar}
      activeHuntId={activeHuntId}
      onSelectHunt={handleSelectHunt}
      onNewHunt={handleNewHunt}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Chat
              projectId={projectId!}
              huntId={activeHuntId}
              onSearchingChange={setIsSearching}
            />
          }
        />
        <Route path="/analyzer" element={<ManualAnalyzer projectId={projectId!} />} />
        <Route path="/today" element={<DailyFinds projectId={projectId!} />} />
        <Route path="/board" element={<MoodBoard projectId={projectId!} />} />
        <Route
          path="/settings"
          element={
            <div className="max-w-lg mx-auto mt-8">
              <AutoScoutSettings
                projectId={projectId!}
                onClose={() => navigate(`/projects/${projectId}`)}
              />
            </div>
          }
        />
      </Routes>
    </AppShell>
  );
}
