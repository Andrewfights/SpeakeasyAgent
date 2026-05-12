import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout';
import { Chat } from '../components/Chat';

export function StandaloneChat() {
  const navigate = useNavigate();
  const { huntId } = useParams();
  const [activeHuntId, setActiveHuntId] = useState<string | undefined>(huntId);
  const [isSearching, setIsSearching] = useState(false);

  // Sync activeHuntId with URL param
  useEffect(() => {
    setActiveHuntId(huntId);
  }, [huntId]);

  const handleSelectHunt = useCallback((id: string) => {
    setActiveHuntId(id);
    navigate(`/chat/${id}`);
  }, [navigate]);

  const handleNewHunt = useCallback(async (projectId?: string) => {
    try {
      const res = await fetch('/api/hunts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New hunt',
          project_id: projectId || null
        })
      });
      const hunt = await res.json();
      setActiveHuntId(hunt.id);
      navigate(`/chat/${hunt.id}`);
    } catch (err) {
      console.error('Failed to create hunt:', err);
    }
  }, [navigate]);

  // Create a new hunt automatically when starting a chat without one
  const ensureHuntExists = useCallback(async () => {
    if (!activeHuntId) {
      await handleNewHunt();
    }
  }, [activeHuntId, handleNewHunt]);

  return (
    <AppShell
      showProjectContext={false}
      isSearching={isSearching}
      showHuntsSidebar={true}
      activeHuntId={activeHuntId}
      onSelectHunt={handleSelectHunt}
      onNewHunt={handleNewHunt}
    >
      <Chat
        huntId={activeHuntId}
        onSearchingChange={setIsSearching}
        onNeedHunt={ensureHuntExists}
      />
    </AppShell>
  );
}

export default StandaloneChat;
