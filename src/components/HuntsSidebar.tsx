import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconSearch, IconSettings } from './ui/Icons';

interface Hunt {
  id: string;
  project_id?: string;
  title: string;
  is_pinned: boolean;
  saved_count: number;
  items_returned: number;
  best_price?: number;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  color?: string;
  budget_per_item?: number;
  auto_scout_enabled?: boolean;
  auto_scout_status?: 'running' | 'scanning' | 'paused' | 'off';
  new_finds_count?: number;
}

interface HuntsData {
  projects: { project: Project; hunts: Hunt[] }[];
  unsorted: Hunt[];
  pinned: Hunt[];
}

interface HuntsSidebarProps {
  activeHuntId?: string;
  onSelectHunt: (huntId: string) => void;
  onNewHunt: (projectId?: string) => void;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

// Caret icon
function IconCaret({ size = 9, open = false }: { size?: number; open?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 160ms' }}
    >
      <path d="M9 6 L15 12 L9 18"/>
    </svg>
  );
}

// Pin/star icon for pinned hunts
function IconStar({ size = 9 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 L9 7 L4 8 L7.5 12 L6.5 18 L12 15 L17.5 18 L16.5 12 L20 8 L15 7 Z"/>
    </svg>
  );
}

// Circle icon for regular hunts
function IconCircle({ size = 9 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
    </svg>
  );
}

// Collapse icon
function IconCollapse({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 6 L9 12 L15 18"/>
    </svg>
  );
}

// Sparkle icon for new finds
function IconSparkle({ size = 9 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z"/>
    </svg>
  );
}

export function HuntsSidebar({ activeHuntId, onSelectHunt, onNewHunt }: HuntsSidebarProps) {
  const [huntsData, setHuntsData] = useState<HuntsData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchHunts();
    fetchProjects();
  }, []);

  const fetchHunts = async () => {
    try {
      const res = await fetch('/api/hunts/grouped');
      const data = await res.json();
      setHuntsData(data);
      // Auto-expand project containing active hunt
      if (activeHuntId && data.projects) {
        for (const { project, hunts } of data.projects) {
          if (hunts.some((h: Hunt) => h.id === activeHuntId)) {
            setExpandedProjects(prev => new Set([...prev, project.id]));
            break;
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch hunts:', err);
      // Set empty data so we don't show loading forever
      setHuntsData({ projects: [], unsorted: [], pinned: [] });
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setProjects([]);
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const filterHunts = (hunts: Hunt[]) => {
    if (!searchQuery) return hunts;
    const q = searchQuery.toLowerCase();
    return hunts.filter(h => h.title.toLowerCase().includes(q));
  };

  const filterProjects = (projs: { project: Project; hunts: Hunt[] }[]) => {
    if (!searchQuery) return projs;
    const q = searchQuery.toLowerCase();
    return projs.filter(({ project, hunts }) =>
      project.name.toLowerCase().includes(q) ||
      hunts.some(h => h.title.toLowerCase().includes(q))
    );
  };

  const totalHuntsCount = huntsData
    ? huntsData.pinned.length + huntsData.unsorted.length + huntsData.projects.reduce((sum, p) => sum + p.hunts.length, 0)
    : 0;

  // Loading state
  if (!huntsData) {
    return (
      <div className="sidebar-unified">
        <div className="sb-brand">
          <span className="lab">Workspace</span>
        </div>
        <div className="sb-loading">
          <div className="sb-loading-dot" />
        </div>
      </div>
    );
  }

  const filteredProjectGroups = filterProjects(huntsData.projects);
  const unsortedHunts = filterHunts(huntsData.unsorted);

  return (
    <div className="sidebar-unified">
      {/* Brand header */}
      <div className="sb-brand">
        <span className="lab">Workspace</span>
        <button
          className="new-btn"
          onClick={() => navigate('/projects')}
          aria-label="New project"
        >
          <IconPlus size={13} />
        </button>
        <button className="collapse" aria-label="Collapse sidebar">
          <IconCollapse size={12} />
        </button>
      </div>

      {/* Search */}
      <div className="sb-search">
        <div className="field">
          <IconSearch size={12} />
          <input
            placeholder="Search projects, hunts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="kbd">⌘K</span>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="sb-list">
        {/* Projects section header */}
        <div className="sb-section">
          <span>Projects</span>
          <span className="count">{projects.length}</span>
        </div>

        {/* Project groups */}
        {filteredProjectGroups.map(({ project, hunts }) => {
          const isOpen = expandedProjects.has(project.id);
          const filteredHunts = filterHunts(hunts);
          const isCurrent = hunts.some(h => h.id === activeHuntId);

          return (
            <div key={project.id} className="proj-group">
              {/* Project header row */}
              <div
                className={`proj ${isOpen ? 'open' : ''} ${isCurrent ? 'current' : ''}`}
                onClick={() => toggleProject(project.id)}
              >
                <span className="caret">
                  <IconCaret size={9} open={isOpen} />
                </span>
                <span
                  className="sw"
                  style={{ background: project.color || '#7f1d1d' }}
                />
                <span className="nm">{project.name}</span>
                <span className="count">{hunts.length}</span>
              </div>

              {/* Auto-scout status pill - always visible */}
              <div className="proj-meta">
                <span className={`scout-pill ${project.auto_scout_status || 'off'}`}>
                  <span className="dot" />
                  {project.auto_scout_status === 'scanning' ? 'Scanning...' :
                   project.auto_scout_status === 'running' ? 'Auto-scout on' :
                   project.auto_scout_status === 'paused' ? 'Paused' :
                   'Auto-scout off'}
                </span>
                {(project.new_finds_count || 0) > 0 && (
                  <span className="find-pill">
                    <IconSparkle size={9} />
                    <span className="num">{project.new_finds_count} new</span>
                  </span>
                )}
              </div>

              {/* Hunts list - when expanded */}
              {isOpen && (
                <>
                  <div className="hunts">
                    {filteredHunts.map(hunt => (
                      <div
                        key={hunt.id}
                        className={`hunt-row ${hunt.id === activeHuntId ? 'on' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectHunt(hunt.id);
                        }}
                      >
                        <div className="ic">
                          {hunt.is_pinned ? <IconStar size={9} /> : <IconCircle size={9} />}
                        </div>
                        <div className="info">
                          <div className="ti">{hunt.title}</div>
                          <div className="mt">
                            <span>{formatTime(hunt.updated_at)}</span>
                            {hunt.saved_count > 0 && (
                              <>
                                <span className="pip" />
                                <span className="gold">{hunt.saved_count} saved</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick actions */}
                  <div className="proj-actions">
                    <button
                      className="qa"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewHunt(project.id);
                      }}
                    >
                      <IconPlus size={9} />
                      New hunt
                    </button>
                    <button
                      className="qa"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}/board`);
                      }}
                    >
                      Saved ({hunts.reduce((sum, h) => sum + h.saved_count, 0)})
                    </button>
                    <button
                      className="qa"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}/auto-scout`);
                      }}
                    >
                      Tune scout
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Unsorted hunts section */}
        {unsortedHunts.length > 0 && (
          <div className="unsorted-section">
            <div className="sb-section">
              <span>Unsorted hunts</span>
              <span className="count">{unsortedHunts.length}</span>
            </div>
            {unsortedHunts.map(hunt => (
              <div
                key={hunt.id}
                className={`hunt-row unsorted ${hunt.id === activeHuntId ? 'on' : ''}`}
                onClick={() => onSelectHunt(hunt.id)}
              >
                <div className="ic">
                  <IconCircle size={9} />
                </div>
                <div className="info">
                  <div className="ti">{hunt.title}</div>
                  <div className="mt">
                    <span>{formatTime(hunt.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredProjectGroups.length === 0 && unsortedHunts.length === 0 && !searchQuery && (
          <div className="sb-empty">
            <div className="sb-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 7 A2 2 0 0 1 5 5 L9 5 L11 7 L19 7 A2 2 0 0 1 21 9 L21 17 A2 2 0 0 1 19 19 L5 19 A2 2 0 0 1 3 17 Z"/>
              </svg>
            </div>
            <p>No projects yet</p>
            <button className="sb-empty-btn" onClick={() => navigate('/projects')}>
              <IconPlus size={11} />
              Create first project
            </button>
          </div>
        )}
      </div>

      {/* New project button - pinned above user block */}
      <div className="sb-new-proj-row">
        <button className="new-proj" onClick={() => navigate('/projects')}>
          <IconPlus size={11} />
          New project
        </button>
      </div>

      {/* User block - anchored to bottom */}
      <div className="user-block" onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>
        <div className="av-small">SQ</div>
        <div className="ui">
          <div className="n">Scout</div>
          <div className="s">{totalHuntsCount} hunts · {projects.length} projects</div>
        </div>
        <button className="gear" onClick={(e) => { e.stopPropagation(); navigate('/settings'); }}>
          <IconSettings size={14} />
        </button>
      </div>
    </div>
  );
}

export default HuntsSidebar;
