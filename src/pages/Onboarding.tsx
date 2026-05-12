import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout';
import { Button } from '../components/ui';
import { IconPlus } from '../components/ui/Icons';

interface Project {
  id: string;
  name: string;
  description: string;
  default_max_price: number;
  created_at: string;
  item_count?: number;
}

interface Stats {
  saved_this_week: number;
  tracking: number;
  great_deals: number;
}

export function Onboarding() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats>({ saved_this_week: 0, tracking: 0, great_deals: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [budget, setBudget] = useState(200);
  const [zipCode, setZipCode] = useState('');
  const [searchRadius, setSearchRadius] = useState(50);
  const [autoScoutEnabled, setAutoScoutEnabled] = useState(false);
  const [autoScoutTime, setAutoScoutTime] = useState('08:00');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch projects
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data))
      .catch(console.error);

    // Fetch stats
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => setStats({ saved_this_week: 0, tracking: 0, great_deals: 0 }));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: desc,
        default_max_price: budget,
        zip_code: zipCode || undefined,
        search_radius: searchRadius
      })
    });
    const proj = await res.json();

    // Enable auto-scout if selected
    if (autoScoutEnabled) {
      await fetch(`/api/projects/${proj.id}/auto-scout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true, time: autoScoutTime })
      });
    }

    navigate(`/projects/${proj.id}`);
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AppShell
      showProjectContext={false}
      rightContent={
        <>
          <Button variant="primary" onClick={() => setIsCreating(true)}>
            <IconPlus size={13} />
            New project
          </Button>
          <div className="avatar">SQ</div>
        </>
      }
    >
      <div className="p-5 md:p-6 max-w-6xl">
        {/* Header */}
        <div className="eyebrow">{today}</div>
        <h1 className="heading-1 mt-1">Welcome back, squid</h1>
        <p className="caption mt-1">
          {projects.length} room{projects.length !== 1 ? 's' : ''} scouting. Track your items and finds.
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="stat-card">
            <div className="stat-card-label">Saved this week</div>
            <div className="stat-card-value">{stats.saved_this_week}</div>
            <div className="stat-card-delta">{stats.saved_this_week > 0 ? 'Items saved' : 'No items yet'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Tracking</div>
            <div className="stat-card-value">{stats.tracking}</div>
            <div className="stat-card-delta">{stats.tracking > 0 ? 'Items tracked' : 'No items yet'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Great deals waiting</div>
            <div className="stat-card-value">{stats.great_deals}</div>
            <div className="stat-card-delta">{stats.great_deals > 0 ? 'Score 90+' : 'No deals yet'}</div>
          </div>
        </div>

        {/* Section header */}
        <div className="section-header mt-6 mb-4">Your projects</div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              isActive={index === 0}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}

          {/* New project card */}
          <button
            onClick={() => setIsCreating(true)}
            className="project-card flex flex-col items-center justify-center min-h-[180px] border-dashed"
            style={{ background: 'transparent' }}
          >
            <IconPlus size={18} className="mb-2" style={{ color: 'var(--color-gold)' }} />
            <span style={{ color: 'var(--color-dim)', fontSize: 11.5 }}>Start a new room</span>
          </button>
        </div>

        {/* Create modal */}
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10, 8, 6, 0.9)' }}>
            <div
              className="w-full max-w-md rounded-lg p-6"
              style={{ background: 'var(--color-bg-card)', border: '0.5px solid var(--color-border-strong)' }}
            >
              <div className="eyebrow mb-2">New project</div>
              <h2 className="heading-1 mb-6">Start a new room</h2>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="input-label">Project name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input"
                    placeholder="e.g. Basement Bourbon Lounge"
                  />
                </div>

                <div>
                  <label className="input-label">Vibe & style</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    required
                    rows={3}
                    className="input"
                    placeholder="Art deco, oxblood, brass, moody lighting..."
                  />
                </div>

                <div>
                  <label className="input-label">Default budget per item</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    required
                    className="input"
                    placeholder="200"
                  />
                </div>

                {/* Location Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Zip Code</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="input"
                      placeholder="e.g. 90210"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="input-label">Search Radius (miles)</label>
                    <select
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="input"
                    >
                      <option value={10}>10 miles</option>
                      <option value={25}>25 miles</option>
                      <option value={50}>50 miles</option>
                      <option value={100}>100 miles</option>
                      <option value={250}>250 miles</option>
                      <option value={0}>Nationwide</option>
                    </select>
                  </div>
                </div>

                {/* Auto-Scout Settings */}
                <div
                  className="p-3 rounded-lg"
                  style={{ background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border)' }}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScoutEnabled}
                      onChange={(e) => setAutoScoutEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-gold)]"
                    />
                    <div>
                      <span style={{ color: 'var(--color-cream)', fontFamily: 'var(--font-display)', fontSize: 12 }}>
                        Enable overnight auto-scout
                      </span>
                      <p style={{ color: 'var(--color-muted)', fontSize: 11, marginTop: 2 }}>
                        Automatically search for new items daily
                      </p>
                    </div>
                  </label>

                  {autoScoutEnabled && (
                    <div className="mt-3">
                      <label className="input-label">Scout time</label>
                      <input
                        type="time"
                        value={autoScoutTime}
                        onChange={(e) => setAutoScoutTime(e.target.value)}
                        className="input"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" variant="primary" className="flex-1 justify-center">
                    Create project
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

interface ProjectCardProps {
  project: Project;
  isActive?: boolean;
  onClick: () => void;
}

function ProjectCard({ project, isActive, onClick }: ProjectCardProps) {
  // Calculate days ago
  const daysAgo = Math.floor(
    (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const timeLabel = daysAgo === 0 ? 'Active' : `${daysAgo}d ago`;

  return (
    <div
      className={`project-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {/* Cover grid with placeholder SVGs */}
      <div className="project-card-cover">
        <div>
          <svg width="44" height="44" viewBox="0 0 80 80">
            <g fill="#7f1d1d" stroke="#991b1b">
              <ellipse cx="40" cy="22" rx="20" ry="5" />
              <rect x="22" y="22" width="36" height="16" />
            </g>
          </svg>
        </div>
        <div>
          <svg width="44" height="44" viewBox="0 0 80 80">
            <g fill="#fbbf24" stroke="#b8860b">
              <circle cx="40" cy="40" r="16" />
            </g>
          </svg>
        </div>
        <div>
          <svg width="44" height="44" viewBox="0 0 80 80">
            <g fill="#78350f" stroke="#fbbf24">
              <rect x="22" y="32" width="36" height="22" rx="2" />
            </g>
          </svg>
        </div>
        <div>
          <svg width="44" height="44" viewBox="0 0 80 80">
            <g fill="#fefce8" stroke="#b8860b">
              <ellipse cx="40" cy="44" rx="14" ry="20" />
            </g>
          </svg>
        </div>
      </div>

      <div className="project-card-info">
        <div className="project-card-title">{project.name}</div>
        <div className="project-card-vibe">{project.description || 'No description'}</div>
        <div className="project-card-stats">
          <span><b>{project.item_count || 0}</b> items</span>
          <span><b>${project.default_max_price}</b> max</span>
          <span
            style={{
              marginLeft: 'auto',
              color: isActive ? 'var(--color-gold)' : undefined
            }}
          >
            {timeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
