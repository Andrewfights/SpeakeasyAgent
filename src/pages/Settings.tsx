import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  color?: string;
  auto_scout_enabled?: boolean;
  auto_scout_status?: 'running' | 'scanning' | 'paused' | 'off';
  hunts_count?: number;
  saved_count?: number;
}

interface UserSettings {
  displayName: string;
  email: string;
  location: string;
  twoFactorEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  reduceMotion: boolean;
  compactDensity: boolean;
  showSourceIcons: boolean;
  pushNotifications: boolean;
  pushThreshold: number;
  priceDropAlerts: boolean;
  localPickupAlerts: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  digestEnabled: boolean;
  digestFrequency: 'daily' | 'weekdays' | 'weekly' | 'off';
  digestTime: string;
  sundayPortfolio: boolean;
}

const defaultSettings: UserSettings = {
  displayName: 'Scout User',
  email: 'user@example.com',
  location: 'Los Angeles, CA',
  twoFactorEnabled: false,
  theme: 'dark',
  reduceMotion: false,
  compactDensity: false,
  showSourceIcons: true,
  pushNotifications: true,
  pushThreshold: 90,
  priceDropAlerts: true,
  localPickupAlerts: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  digestEnabled: true,
  digestFrequency: 'weekdays',
  digestTime: '07:00',
  sundayPortfolio: false,
};

// Icons
function IconUser({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 21 A8 8 0 0 1 20 21"/>
    </svg>
  );
}

function IconFolder({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 7 A2 2 0 0 1 5 5 L9 5 L11 7 L19 7 A2 2 0 0 1 21 9 L21 17 A2 2 0 0 1 19 19 L5 19 A2 2 0 0 1 3 17 Z"/>
    </svg>
  );
}

function IconBell({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 8 A6 6 0 0 0 6 8 L6 12 L4 16 L20 16 L18 12 Z M9 19 A3 3 0 0 0 15 19"/>
    </svg>
  );
}

function IconLink({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 13 A5 5 0 0 0 17 13 L20 10 A5 5 0 0 0 13 3 L11 5 M14 11 A5 5 0 0 0 7 11 L4 14 A5 5 0 0 0 11 21 L13 19"/>
    </svg>
  );
}

function IconSun({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12 M4.5 4.5 L6.5 6.5 M17.5 17.5 L19.5 19.5"/>
    </svg>
  );
}

function IconKeyboard({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 11 L7 11.01 M11 11 L11 11.01 M15 11 L15 11.01 M7 15 L17 15"/>
    </svg>
  );
}

function IconChat({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 11 A9 9 0 0 1 12 20 L3 20 L5 16 A9 9 0 1 1 21 11 Z"/>
    </svg>
  );
}

function IconWarning({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 9 L12 13 M12 17 L12 17.01"/>
      <path d="M10.3 3.86 L1.82 18 A2 2 0 0 0 3.54 21 L20.46 21 A2 2 0 0 0 22.18 18 L13.71 3.86 A2 2 0 0 0 10.29 3.86 Z"/>
    </svg>
  );
}

function IconBack({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 18 L9 12 L15 6"/>
    </svg>
  );
}

function IconChevron({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 9 L12 15 L18 9"/>
    </svg>
  );
}

function IconPlus({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5 L12 19 M5 12 L19 12"/>
    </svg>
  );
}

// Toggle component
function Toggle({ on, onChange }: { on: boolean; onChange: (value: boolean) => void }) {
  return (
    <div
      className={`set-toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
    />
  );
}

// Small toggle for per-project settings
function ToggleSmall({ on, onChange }: { on: boolean; onChange: (value: boolean) => void }) {
  return (
    <div
      className={`set-toggle-sm ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
    />
  );
}

export function Settings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('account');
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectNotifs, setProjectNotifs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load projects
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        setProjects(data);
        // Initialize project notification toggles
        const notifs: Record<string, boolean> = {};
        data.forEach((p: Project) => { notifs[p.id] = true; });
        setProjectNotifs(notifs);
      })
      .catch(console.error);
  }, []);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // TODO: Save to backend
  };

  const navItems = [
    { section: 'you', items: [
      { id: 'account', label: 'Account', icon: IconUser },
      { id: 'projects', label: 'Projects', icon: IconFolder, badge: projects.length.toString() },
    ]},
    { section: 'hunting', items: [
      { id: 'notifications', label: 'Notifications', icon: IconBell },
      { id: 'connected', label: 'Connected accounts', icon: IconLink },
    ]},
    { section: 'app', items: [
      { id: 'appearance', label: 'Appearance', icon: IconSun },
      { id: 'shortcuts', label: 'Keyboard shortcuts', icon: IconKeyboard },
      { id: 'support', label: 'Support & feedback', icon: IconChat },
    ]},
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`set-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="set-page">
      {/* Top bar */}
      <div className="set-bar">
        <button className="set-back" onClick={() => navigate(-1)}>
          <IconBack size={14} />
        </button>
        <div className="set-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <g stroke="#fbbf24" strokeWidth="1.4" fill="none" strokeLinecap="round">
              <path d="M12 2 L12 22 M2 12 L22 12 M4.5 4.5 L19.5 19.5 M19.5 4.5 L4.5 19.5"/>
              <circle cx="12" cy="12" r="3" fill="#fbbf24" stroke="none"/>
              <circle cx="12" cy="12" r="7"/>
            </g>
          </svg>
          <span>Settings</span>
        </div>
        <div className="set-av">SQ</div>
      </div>

      <div className="set-body">
        {/* Sidebar nav */}
        <nav className="set-nav">
          {navItems.map(group => (
            <div key={group.section}>
              <div className="set-nav-section">{group.section}</div>
              {group.items.map(item => (
                <a
                  key={item.id}
                  className={`set-nav-item ${activeSection === item.id ? 'on' : ''}`}
                  onClick={() => scrollToSection(item.id)}
                >
                  <i><item.icon size={14} /></i>
                  <span>{item.label}</span>
                  {item.badge && <span className="set-nav-badge">{item.badge}</span>}
                </a>
              ))}
            </div>
          ))}
        </nav>

        {/* Main content */}
        <div className="set-content">
          {/* Header */}
          <div className="set-page-hd">
            <div className="set-eyebrow">Settings</div>
            <h1>The <em>house rules</em></h1>
            <p>Tune scout to your taste. Account info, notifications, integrations, and the few things you only need once.</p>
          </div>

          {/* 01 Account */}
          <section className="set-section" id="set-account">
            <div className="set-section-hd">
              <span className="set-num">01</span>
              <h3>Account</h3>
            </div>

            <div className="set-account-card">
              <div className="set-av-big">{settings.displayName.substring(0, 2).toUpperCase()}</div>
              <div className="set-account-info">
                <div className="set-account-name">{settings.displayName}</div>
                <div className="set-account-email">{settings.email}</div>
                <div className="set-account-meta">
                  <span><b>#</b> SQ-{Math.floor(Math.random() * 900000 + 100000)}</span>
                  <span className="set-meta-sep">·</span>
                  <span>Member since May 2026</span>
                  <span className="set-meta-sep">·</span>
                  <span>{settings.location}</span>
                </div>
              </div>
              <button className="set-btn-ghost">Edit profile</button>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Display name</div>
                <div className="set-row-desc">How scout greets you in the chat and email digest.</div>
              </div>
              <div className="set-row-ctrl">
                <input
                  className="set-input"
                  value={settings.displayName}
                  onChange={e => updateSetting('displayName', e.target.value)}
                />
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Email</div>
                <div className="set-row-desc">Used for sign-in, the morning digest, and price-drop alerts.</div>
              </div>
              <div className="set-row-ctrl">
                <input
                  className="set-input"
                  type="email"
                  value={settings.email}
                  onChange={e => updateSetting('email', e.target.value)}
                />
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Location</div>
                <div className="set-row-desc">Sets the radius for <code>FB Marketplace</code> and <code>Craigslist</code> local searches.</div>
              </div>
              <div className="set-row-ctrl">
                <button className="set-select">
                  {settings.location}
                  <IconChevron size={10} />
                </button>
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Password</div>
                <div className="set-row-desc">Last changed <b>3 months ago</b>.</div>
              </div>
              <div className="set-row-ctrl">
                <button className="set-btn-ghost subtle">Change password</button>
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Two-factor auth</div>
                <div className="set-row-desc">Add a second step at sign-in. Recommended.</div>
              </div>
              <div className="set-row-ctrl">
                <Toggle on={settings.twoFactorEnabled} onChange={v => updateSetting('twoFactorEnabled', v)} />
              </div>
            </div>
          </section>

          {/* 02 Projects */}
          <section className="set-section" id="set-projects">
            <div className="set-section-hd">
              <span className="set-num">02</span>
              <h3>Projects</h3>
              <span className="set-section-meta">{projects.length} active</span>
            </div>

            <p className="set-section-desc">
              Quick overview. <b>Each project's full settings — brief, budget, sources, schedule — live inside the project itself.</b>
            </p>

            <div className="set-projects-list">
              {projects.map(project => (
                <div key={project.id} className="set-proj-row">
                  <span className="set-proj-sw" style={{ background: project.color || '#7f1d1d' }} />
                  <div className="set-proj-info">
                    <div className="set-proj-name">{project.name}</div>
                    <div className="set-proj-meta">
                      <span className="set-proj-stat"><b>{project.hunts_count || 0}</b> hunts</span>
                      <span className="set-meta-sep">·</span>
                      <span className="set-proj-stat"><b>{project.saved_count || 0}</b> saved</span>
                      <span className="set-meta-sep">·</span>
                      <span className={`set-scout-pill ${project.auto_scout_status || 'off'}`}>
                        <span className="set-scout-dot" />
                        {project.auto_scout_status === 'running' ? 'Auto-scout on' :
                         project.auto_scout_status === 'scanning' ? 'Scanning...' :
                         project.auto_scout_status === 'paused' ? 'Paused' : 'Off'}
                      </span>
                    </div>
                  </div>
                  <button className="set-btn-ghost subtle" onClick={() => navigate(`/projects/${project.id}`)}>Open</button>
                </div>
              ))}
            </div>

            <div className="set-proj-actions">
              <button className="set-btn-ghost" onClick={() => navigate('/projects')}>
                <IconPlus size={11} />
                New project
              </button>
            </div>
          </section>

          {/* 03 Notifications */}
          <section className="set-section" id="set-notifications">
            <div className="set-section-hd">
              <span className="set-num">03</span>
              <h3>Notifications</h3>
              <span className="set-section-meta">Push, email, per-project</span>
            </div>

            <p className="set-section-desc">
              Scout's quiet by design. <b>Default is 90+ for push — that's maybe one buzz every two or three days.</b>
            </p>

            <h5 className="set-subsection">Push · phone</h5>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Great deal alerts</div>
                <div className="set-row-desc">Buzz the phone when scout finds something at or above your threshold.</div>
                <div className="set-threshold-pills">
                  {[85, 90, 95].map(val => (
                    <button
                      key={val}
                      className={`set-pill ${settings.pushThreshold === val ? 'on' : ''}`}
                      onClick={() => updateSetting('pushThreshold', val)}
                    >
                      {val}+{val === 95 && ' only'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="set-row-ctrl">
                <Toggle on={settings.pushNotifications} onChange={v => updateSetting('pushNotifications', v)} />
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Price drops on saved items</div>
                <div className="set-row-desc">When something on your boards drops <b>15%+</b>.</div>
              </div>
              <div className="set-row-ctrl">
                <Toggle on={settings.priceDropAlerts} onChange={v => updateSetting('priceDropAlerts', v)} />
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Local pickup nearby</div>
                <div className="set-row-desc">FB or Craigslist finds within <b>10 miles</b>.</div>
              </div>
              <div className="set-row-ctrl">
                <Toggle on={settings.localPickupAlerts} onChange={v => updateSetting('localPickupAlerts', v)} />
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Quiet hours</div>
                <div className="set-row-desc">No push between these times. Digest still arrives at 7am.</div>
              </div>
              <div className="set-row-ctrl">
                <div className="set-time-display">10pm – 7am</div>
              </div>
            </div>

            <h5 className="set-subsection">Email digest</h5>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Morning digest</div>
                <div className="set-row-desc">Daily recap of what scout found overnight.</div>
                <div className="set-threshold-pills">
                  {(['daily', 'weekdays', 'weekly', 'off'] as const).map(val => (
                    <button
                      key={val}
                      className={`set-pill ${settings.digestFrequency === val ? 'on' : ''}`}
                      onClick={() => updateSetting('digestFrequency', val)}
                    >
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="set-row-ctrl">
                <Toggle on={settings.digestEnabled} onChange={v => updateSetting('digestEnabled', v)} />
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Send at</div>
                <div className="set-row-desc">When your inbox is ready for it.</div>
              </div>
              <div className="set-row-ctrl">
                <div className="set-time-display">7:00 AM</div>
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Sunday portfolio</div>
                <div className="set-row-desc">Weekly recap of saved items, total spend, and pieces worth pulling the trigger on.</div>
              </div>
              <div className="set-row-ctrl">
                <Toggle on={settings.sundayPortfolio} onChange={v => updateSetting('sundayPortfolio', v)} />
              </div>
            </div>

            <h5 className="set-subsection">Per project</h5>

            <div className="set-proj-notif-list">
              {projects.map(project => (
                <div key={project.id} className="set-proj-notif-row">
                  <span className="set-proj-sw" style={{ background: project.color || '#7f1d1d' }} />
                  <span className="set-proj-notif-nm">{project.name}</span>
                  <span className="set-proj-notif-sub">
                    {projectNotifs[project.id] ? 'All on' : 'Muted'}
                  </span>
                  <ToggleSmall
                    on={projectNotifs[project.id] || false}
                    onChange={v => setProjectNotifs(prev => ({ ...prev, [project.id]: v }))}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 04 Connected accounts */}
          <section className="set-section" id="set-connected">
            <div className="set-section-hd">
              <span className="set-num">04</span>
              <h3>Connected accounts</h3>
              <span className="set-section-meta">Optional · scout works without them</span>
            </div>

            <p className="set-section-desc">
              Connect to save scout's picks directly to your marketplace watchlists. <b>Scout never bids or messages on your behalf — only saves and tracks.</b>
            </p>

            <div className="set-connect-list">
              <div className="set-connect-row">
                <div className="set-connect-icon ebay">eB</div>
                <div className="set-connect-info">
                  <div className="set-connect-name">eBay</div>
                  <div className="set-connect-status">Not connected</div>
                </div>
                <button className="set-btn-ghost">Connect</button>
              </div>

              <div className="set-connect-row">
                <div className="set-connect-icon etsy">Et</div>
                <div className="set-connect-info">
                  <div className="set-connect-name">Etsy</div>
                  <div className="set-connect-status">Not connected</div>
                </div>
                <button className="set-btn-ghost">Connect</button>
              </div>

              <div className="set-connect-row disabled">
                <div className="set-connect-icon fb">FB</div>
                <div className="set-connect-info">
                  <div className="set-connect-name">Facebook Marketplace</div>
                  <div className="set-connect-status">Manual save only · <b>no public API</b></div>
                </div>
                <button className="set-btn-ghost subtle" disabled>N/A</button>
              </div>

              <div className="set-connect-row disabled">
                <div className="set-connect-icon cl">CL</div>
                <div className="set-connect-info">
                  <div className="set-connect-name">Craigslist</div>
                  <div className="set-connect-status">Manual save only · <b>no public API</b></div>
                </div>
                <button className="set-btn-ghost subtle" disabled>N/A</button>
              </div>
            </div>
          </section>

          {/* 05 Appearance */}
          <section className="set-section" id="set-appearance">
            <div className="set-section-hd">
              <span className="set-num">05</span>
              <h3>Appearance</h3>
            </div>

            <div className="set-row">
              <div className="set-row-info" style={{ flex: 'none', width: 200 }}>
                <div className="set-row-nm">Theme</div>
                <div className="set-row-desc">The speakeasy is meant to be dark. <b>Light mode dims the brand.</b></div>
              </div>
              <div className="set-row-ctrl" style={{ flex: 1, maxWidth: 340 }}>
                <div className="set-theme-picker">
                  {(['dark', 'light', 'system'] as const).map(theme => (
                    <div
                      key={theme}
                      className={`set-theme-opt ${settings.theme === theme ? 'on' : ''}`}
                      onClick={() => updateSetting('theme', theme)}
                    >
                      <div className={`set-theme-preview ${theme}`} />
                      <div className="set-theme-nm">{theme.charAt(0).toUpperCase() + theme.slice(1)}</div>
                      <div className="set-theme-sub">
                        {theme === 'dark' ? 'Default' : theme === 'light' ? 'Daytime' : 'Auto'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Reduce motion</div>
                <div className="set-row-desc">Disables the breathing orb, source-chip pulses, and stagger animations.</div>
              </div>
              <div className="set-row-ctrl">
                <Toggle on={settings.reduceMotion} onChange={v => updateSetting('reduceMotion', v)} />
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Compact card density</div>
                <div className="set-row-desc">Smaller listing cards in chat. Useful on tight laptop screens.</div>
              </div>
              <div className="set-row-ctrl">
                <Toggle on={settings.compactDensity} onChange={v => updateSetting('compactDensity', v)} />
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Show source icons in cards</div>
                <div className="set-row-desc">Display eBay, Etsy, FB, Craigslist marks on listing cards.</div>
              </div>
              <div className="set-row-ctrl">
                <Toggle on={settings.showSourceIcons} onChange={v => updateSetting('showSourceIcons', v)} />
              </div>
            </div>
          </section>

          {/* 06 Keyboard shortcuts */}
          <section className="set-section" id="set-shortcuts">
            <div className="set-section-hd">
              <span className="set-num">06</span>
              <h3>Keyboard <em>shortcuts</em></h3>
              <span className="set-section-meta">Reference · not editable</span>
            </div>

            <div className="set-shortcut-grid">
              <div className="set-shortcut-group">
                <h5>Navigation</h5>
                <div className="set-shortcut-row"><span>Search hunts</span><span className="set-kbd"><kbd>⌘</kbd><kbd>K</kbd></span></div>
                <div className="set-shortcut-row"><span>New hunt</span><span className="set-kbd"><kbd>⌘</kbd><kbd>N</kbd></span></div>
                <div className="set-shortcut-row"><span>New project</span><span className="set-kbd"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>N</kbd></span></div>
                <div className="set-shortcut-row"><span>Toggle sidebar</span><span className="set-kbd"><kbd>⌘</kbd><kbd>\</kbd></span></div>
                <div className="set-shortcut-row"><span>Open settings</span><span className="set-kbd"><kbd>⌘</kbd><kbd>,</kbd></span></div>
              </div>

              <div className="set-shortcut-group">
                <h5>Chat</h5>
                <div className="set-shortcut-row"><span>Send message</span><span className="set-kbd"><kbd>↵</kbd></span></div>
                <div className="set-shortcut-row"><span>New line</span><span className="set-kbd"><kbd>⇧</kbd><kbd>↵</kbd></span></div>
                <div className="set-shortcut-row"><span>Voice mode</span><span className="set-kbd"><kbd>⌘</kbd><kbd>␣</kbd></span></div>
                <div className="set-shortcut-row"><span>Cancel response</span><span className="set-kbd"><kbd>esc</kbd></span></div>
                <div className="set-shortcut-row"><span>Regenerate response</span><span className="set-kbd"><kbd>⌘</kbd><kbd>R</kbd></span></div>
              </div>

              <div className="set-shortcut-group">
                <h5>Cards</h5>
                <div className="set-shortcut-row"><span>Save focused card</span><span className="set-kbd"><kbd>S</kbd></span></div>
                <div className="set-shortcut-row"><span>Skip focused card</span><span className="set-kbd"><kbd>X</kbd></span></div>
                <div className="set-shortcut-row"><span>Open detail view</span><span className="set-kbd"><kbd>↵</kbd></span></div>
                <div className="set-shortcut-row"><span>Next / prev card</span><span className="set-kbd"><kbd>→</kbd><kbd>←</kbd></span></div>
                <div className="set-shortcut-row"><span>Open external link</span><span className="set-kbd"><kbd>⌘</kbd><kbd>↵</kbd></span></div>
              </div>

              <div className="set-shortcut-group">
                <h5>Auto-scout</h5>
                <div className="set-shortcut-row"><span>Run now</span><span className="set-kbd"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>R</kbd></span></div>
                <div className="set-shortcut-row"><span>Toggle auto-scout</span><span className="set-kbd"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>A</kbd></span></div>
                <div className="set-shortcut-row"><span>Pause for a week</span><span className="set-kbd"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>P</kbd></span></div>
              </div>
            </div>
          </section>

          {/* 07 Support & feedback */}
          <section className="set-section" id="set-support">
            <div className="set-section-hd">
              <span className="set-num">07</span>
              <h3>Support & feedback</h3>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Send feedback to the team</div>
                <div className="set-row-desc">Bug, feature wish, complaint about scout's taste — <b>it all helps</b>.</div>
              </div>
              <div className="set-row-ctrl">
                <button className="set-btn-ghost">Open feedback</button>
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Help docs</div>
                <div className="set-row-desc">How auto-scout works, what the scoring means, what each marketplace integration does.</div>
              </div>
              <div className="set-row-ctrl">
                <button className="set-btn-ghost subtle">Read docs</button>
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Email support</div>
                <div className="set-row-desc">Get a reply within <b>24 hours</b>.</div>
              </div>
              <div className="set-row-ctrl">
                <button className="set-btn-ghost subtle">Contact us</button>
              </div>
            </div>

            <div className="set-row">
              <div className="set-row-info">
                <div className="set-row-nm">Privacy & terms</div>
                <div className="set-row-desc">What we store, what we don't, who sees it.</div>
              </div>
              <div className="set-row-ctrl">
                <button className="set-btn-ghost subtle">Review</button>
              </div>
            </div>

            {/* Danger zone */}
            <div className="set-danger-zone">
              <div className="set-danger-hd">
                <IconWarning size={11} />
                Danger zone
              </div>

              <div className="set-danger-row">
                <div className="set-row-info">
                  <div className="set-row-nm">Export all data</div>
                  <div className="set-row-desc">Download your projects, hunts, and saved items as JSON.</div>
                </div>
                <button className="set-btn-ghost subtle">Export data</button>
              </div>

              <div className="set-danger-row">
                <div className="set-row-info">
                  <div className="set-row-nm warn">Delete account</div>
                  <div className="set-row-desc">Permanently remove your account, projects, hunts, and saved items. <b>This can't be undone.</b></div>
                </div>
                <button className="set-btn-danger">Delete account</button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default Settings;
