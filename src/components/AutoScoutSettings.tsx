import { useState, useEffect } from 'react';
import { Button } from './ui';
import { IconPlus, IconX, IconBolt } from './ui/Icons';

interface ScoutQuery {
  id: string;
  query: string;
  priority: number;
  enabled: boolean;
  last_run?: string;
  items_found: number;
}

interface ProjectSettings {
  auto_scout_enabled: boolean;
  auto_scout_time: string;
  scout_queries: ScoutQuery[];
}

interface AutoScoutSettingsProps {
  projectId: string;
  onClose?: () => void;
}

export function AutoScoutSettings({ projectId, onClose }: AutoScoutSettingsProps) {
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [queries, setQueries] = useState<ScoutQuery[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [scoutTime, setScoutTime] = useState('08:00');
  const [newQuery, setNewQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    fetch(`/api/projects/${projectId}/settings`)
      .then(r => r.json())
      .then(data => {
        setSettings(data);
        setEnabled(!!data.auto_scout_enabled);
        setScoutTime(data.auto_scout_time || '08:00');
        setQueries(data.scout_queries || []);
      });
  }, [projectId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save auto-scout settings
      await fetch(`/api/projects/${projectId}/auto-scout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, time: scoutTime })
      });

      // Save query order
      await fetch(`/api/projects/${projectId}/scout-queries/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: queries.map((q, i) => ({ id: q.id, priority: i }))
        })
      });

      onClose?.();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuery = async () => {
    if (!newQuery.trim()) return;

    const res = await fetch(`/api/projects/${projectId}/scout-queries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: newQuery.trim(), priority: queries.length })
    });
    const query = await res.json();
    setQueries([...queries, query]);
    setNewQuery('');
  };

  const handleDeleteQuery = async (id: string) => {
    await fetch(`/api/scout-queries/${id}`, { method: 'DELETE' });
    setQueries(queries.filter(q => q.id !== id));
  };

  const handleToggleQuery = async (id: string) => {
    const query = queries.find(q => q.id === id);
    if (!query) return;

    await fetch(`/api/scout-queries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !query.enabled })
    });

    setQueries(queries.map(q =>
      q.id === id ? { ...q, enabled: !q.enabled } : q
    ));
  };

  const moveQuery = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= queries.length) return;

    const newQueries = [...queries];
    [newQueries[index], newQueries[newIndex]] = [newQueries[newIndex], newQueries[index]];
    setQueries(newQueries);
  };

  const handleRunNow = async () => {
    setIsRunning(true);
    try {
      await fetch(`/api/projects/${projectId}/run-scout`, { method: 'POST' });
      // Show success message or refresh
    } finally {
      setIsRunning(false);
    }
  };

  if (!settings) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse-dot inline-block w-2 h-2 rounded-full mb-4" style={{ background: 'var(--color-gold)' }} />
        <p style={{ color: 'var(--color-muted)' }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="eyebrow">Settings</div>
          <h2 className="heading-1 mt-1">Auto-Scout</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-border)]"
            style={{ color: 'var(--color-muted)' }}
          >
            <IconX size={16} />
          </button>
        )}
      </div>

      {/* Enable Toggle */}
      <label
        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-4"
        style={{ background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border)' }}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 accent-[var(--color-gold)]"
        />
        <div className="flex-1">
          <span style={{ color: 'var(--color-cream)', fontFamily: 'var(--font-display)', fontSize: 13 }}>
            Enable overnight auto-scout
          </span>
          <p style={{ color: 'var(--color-muted)', fontSize: 11, marginTop: 2 }}>
            Automatically search for new items at the scheduled time
          </p>
        </div>
      </label>

      {/* Time Picker */}
      <div className="mb-5">
        <label className="input-label">Run scout at</label>
        <input
          type="time"
          value={scoutTime}
          onChange={(e) => setScoutTime(e.target.value)}
          className="input"
          disabled={!enabled}
        />
      </div>

      {/* Search Queries */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="input-label" style={{ marginBottom: 0 }}>Search queries</label>
          <span style={{ color: 'var(--color-dim)', fontSize: 10 }}>
            {queries.length} quer{queries.length === 1 ? 'y' : 'ies'}
          </span>
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: 11, marginBottom: 12 }}>
          Add specific searches to run. Higher priority queries run first.
        </p>

        {/* Query List */}
        <div className="space-y-2 mb-3">
          {queries.map((query, index) => (
            <div
              key={query.id}
              className="flex items-center gap-2 p-2 rounded-lg"
              style={{
                background: 'var(--color-bg-surface)',
                border: '0.5px solid var(--color-border)',
                opacity: query.enabled ? 1 : 0.5
              }}
            >
              {/* Priority controls */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveQuery(index, 'up')}
                  disabled={index === 0}
                  className="text-xs px-1 rounded hover:bg-[var(--color-border)] disabled:opacity-30"
                  style={{ color: 'var(--color-dim)' }}
                >
                  ▲
                </button>
                <button
                  onClick={() => moveQuery(index, 'down')}
                  disabled={index === queries.length - 1}
                  className="text-xs px-1 rounded hover:bg-[var(--color-border)] disabled:opacity-30"
                  style={{ color: 'var(--color-dim)' }}
                >
                  ▼
                </button>
              </div>

              {/* Priority number */}
              <span
                className="w-5 h-5 flex items-center justify-center rounded text-xs"
                style={{ background: 'var(--color-gold-tint)', color: 'var(--color-gold)' }}
              >
                {index + 1}
              </span>

              {/* Query text */}
              <span className="flex-1 text-sm" style={{ color: 'var(--color-text)' }}>
                {query.query}
              </span>

              {/* Stats */}
              {query.last_run && (
                <span style={{ color: 'var(--color-dim)', fontSize: 10 }}>
                  {query.items_found} found
                </span>
              )}

              {/* Toggle enabled */}
              <input
                type="checkbox"
                checked={query.enabled}
                onChange={() => handleToggleQuery(query.id)}
                className="w-3.5 h-3.5 accent-[var(--color-gold)]"
              />

              {/* Delete */}
              <button
                onClick={() => handleDeleteQuery(query.id)}
                className="p-1 rounded hover:bg-[var(--color-border)]"
                style={{ color: 'var(--color-dim)' }}
              >
                <IconX size={12} />
              </button>
            </div>
          ))}

          {queries.length === 0 && (
            <div
              className="p-4 rounded-lg text-center"
              style={{ background: 'var(--color-bg-surface)', border: '1px dashed var(--color-border)' }}
            >
              <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>
                No queries yet. Add searches below.
              </p>
            </div>
          )}
        </div>

        {/* Add Query */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddQuery()}
            placeholder="e.g. vintage brass art deco lamp"
            className="input flex-1"
          />
          <Button variant="ghost" onClick={handleAddQuery} disabled={!newQuery.trim()}>
            <IconPlus size={12} />
            Add
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-3" style={{ borderTop: '0.5px solid var(--color-border)' }}>
        <Button
          variant="gold-ghost"
          onClick={handleRunNow}
          disabled={isRunning || queries.length === 0}
          className="flex-1 justify-center"
        >
          <IconBolt size={12} />
          {isRunning ? 'Running...' : 'Run Scout Now'}
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 justify-center"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

export default AutoScoutSettings;
