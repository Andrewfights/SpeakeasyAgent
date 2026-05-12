import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BrandMark, IconPlus, IconArrowLeft } from './ui/Icons';

interface AutoScoutRun {
  id: string;
  timestamp: string;
  type: 'live' | 'great' | 'found' | 'empty';
  label: string;
  message: string;
  finds?: {
    id: string;
    title: string;
    price: number;
    score: number;
    source: 'ebay' | 'etsy' | 'facebook' | 'craigslist';
  }[];
}

interface AutoScoutStats {
  thisWeek: number;
  greatDeals: number;
  saved: number;
  runs: number;
  avgPerDay: number;
  sparkline: number[];
}

interface AutoScoutRules {
  brief: string;
  keywords: string[];
  excludes: string[];
  budgetSoft: number;
  budgetHard: number;
  threshold: number;
  notifyAt: number;
  sources: {
    ebay: boolean;
    etsy: boolean;
    facebook: boolean;
    craigslist: boolean;
  };
  schedule: {
    days: boolean[];
    times: string[];
  };
}

// Mock data
const mockStats: AutoScoutStats = {
  thisWeek: 12,
  greatDeals: 2,
  saved: 3,
  runs: 14,
  avgPerDay: 1.4,
  sparkline: [0, 18, 32, 22, 0, 38, 62, 42, 20, 35, 0, 75, 88, 48]
};

const mockRules: AutoScoutRules = {
  brief: 'Art deco · prohibition era pieces for the bourbon lounge',
  keywords: ['art deco', 'brass', 'velvet', 'oxblood', '1920s', '1930s', 'regency'],
  excludes: ['repro', 'faux'],
  budgetSoft: 200,
  budgetHard: 250,
  threshold: 75,
  notifyAt: 90,
  sources: { ebay: true, etsy: true, facebook: true, craigslist: false },
  schedule: {
    days: [true, true, true, true, true, true, true],
    times: ['7:30 AM', '7:30 PM']
  }
};

const mockRuns: AutoScoutRun[] = [
  {
    id: '1',
    timestamp: 'RUNNING',
    type: 'live',
    label: 'Mid-morning sweep',
    message: 'Scout is checking the marketplaces with your brief. Estimated 1–2 minutes.',
    finds: []
  },
  {
    id: '2',
    timestamp: '07:30',
    type: 'great',
    label: 'Morning sweep · great deal flagged',
    message: 'Heads up. Found a 94 — brass sunburst sconce, $78 on eBay. 38% below comps, period-correct.',
    finds: [
      { id: 'f1', title: 'Brass sunburst sconce', price: 78, score: 94, source: 'ebay' },
      { id: 'f2', title: 'Cut crystal decanter', price: 45, score: 82, source: 'etsy' },
      { id: 'f3', title: 'Velvet club chair', price: 165, score: 78, source: 'facebook' }
    ]
  },
  {
    id: '3',
    timestamp: 'Yesterday',
    type: 'found',
    label: 'Evening sweep · 2 finds',
    message: 'Two scoring in the high 70s. Both Etsy. Worth a glance if the morning pick doesn\'t grab you.',
    finds: [
      { id: 'f4', title: 'Pendant shade pair', price: 88, score: 79, source: 'etsy' },
      { id: 'f5', title: 'Tufted bench', price: 220, score: 76, source: 'etsy' }
    ]
  },
  {
    id: '4',
    timestamp: 'Yesterday',
    type: 'found',
    label: 'Morning sweep · 1 find',
    message: 'One Craigslist piece, local pickup. Score is rough but the price is too.',
    finds: [
      { id: 'f6', title: 'Floor lamp, brass', price: 45, score: 62, source: 'craigslist' }
    ]
  },
  {
    id: '5',
    timestamp: '2 days ago',
    type: 'empty',
    label: 'Evening sweep · nothing new',
    message: 'Quiet evening on the marketplaces. Checked 247 listings, nothing scored above 60.'
  },
  {
    id: '6',
    timestamp: '2 days ago',
    type: 'found',
    label: 'Morning sweep · 3 finds',
    message: 'Solid haul. The eBay regency stool pair is the standout — you already saved that one.',
    finds: [
      { id: 'f7', title: 'Regency stools pair', price: 140, score: 92, source: 'ebay' }
    ]
  }
];

function formatSince(timestamp: string): string {
  if (timestamp === 'RUNNING') return 'Started 0:12 ago';
  if (timestamp === 'Yesterday') return '19:30';
  if (timestamp.includes('days ago')) return '07:30';
  return '4h ago';
}

export function AutoScoutPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isEnabled, setIsEnabled] = useState(true);
  const [stats] = useState<AutoScoutStats>(mockStats);
  const [rules] = useState<AutoScoutRules>(mockRules);
  const [runs] = useState<AutoScoutRun[]>(mockRuns);
  const [scanningStatus, setScanningStatus] = useState({
    ebay: 'done',
    etsy: 'done',
    facebook: 'active',
    craigslist: 'pending'
  });

  const projectName = 'Basement bourbon lounge';

  const handleRunNow = () => {
    // TODO: Trigger manual run
    console.log('Run now clicked');
  };

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
  };

  return (
    <div className="auto-scout-page">
      {/* Hero Section */}
      <div className="as-hero">
        <div className="as-hero-left">
          <div className="as-hero-eyebrow">
            {isEnabled && <span className="live-dot" />}
            Auto-scout · {isEnabled ? 'running' : 'paused'}
          </div>
          <h2 className="as-hero-title">
            Scout's working the <em>back room</em> for you
          </h2>
          <p className="as-hero-desc">
            Checking the four marketplaces twice daily for new listings that match this project's brief.
            Found <b>{stats.thisWeek} pieces this week</b>, {stats.greatDeals} flagged as great deals.
            Next run in <b>4 hours</b>.
          </p>
        </div>
        <div className="as-hero-controls">
          <div className="as-runner">
            <div
              className={`as-toggle-big ${!isEnabled ? 'off' : ''}`}
              onClick={handleToggle}
            />
            <div className="as-runner-info">
              <div className="as-runner-label">Status</div>
              <div className="as-runner-value">
                {isEnabled ? 'Active · twice daily' : 'Paused'}
              </div>
            </div>
          </div>
          <button className="as-run-now" onClick={handleRunNow}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Run now
          </button>
        </div>
      </div>

      <div className="as-body">
        {/* Left: Timeline */}
        <div className="as-timeline-side">
          {/* Stats Row */}
          <div className="as-stat-row">
            <div className="as-stat">
              <div className="as-stat-lab">This week</div>
              <div className="as-stat-val">{stats.thisWeek}</div>
              <div className="as-stat-delta">+4 vs last week</div>
            </div>
            <div className="as-stat">
              <div className="as-stat-lab">Great deals</div>
              <div className="as-stat-val">{stats.greatDeals}</div>
              <div className="as-stat-delta">90+ score</div>
            </div>
            <div className="as-stat">
              <div className="as-stat-lab">Saved by you</div>
              <div className="as-stat-val">{stats.saved}</div>
              <div className="as-stat-delta">25% hit rate</div>
            </div>
            <div className="as-stat">
              <div className="as-stat-lab">Runs</div>
              <div className="as-stat-val">{stats.runs}</div>
              <div className="as-stat-delta neutral">Last 7 days</div>
            </div>
          </div>

          {/* Sparkline */}
          <div className="as-spark-row">
            <div className="as-spark-hd">
              <div className="as-spark-l">Finds per day · last 14</div>
              <div className="as-spark-r"><b>{stats.avgPerDay}</b> avg / day</div>
            </div>
            <div className="as-spark">
              {stats.sparkline.map((val, i) => (
                <div
                  key={i}
                  className={`as-spark-bar ${val === 0 ? 'zero' : val >= 60 ? 'hi' : val >= 30 ? 'med' : 'lo'}`}
                  style={{ height: val === 0 ? '4px' : `${val}%` }}
                />
              ))}
            </div>
            <div className="as-spark-axis">
              <span>Apr 28</span>
              <span>May 5</span>
              <span>Today</span>
            </div>
          </div>

          {/* Timeline Header */}
          <div className="as-section-hd">
            <div className="as-section-ti">Run history</div>
            <div className="as-section-line" />
            <div className="as-section-filter">All · {runs.length}</div>
          </div>

          {/* Timeline */}
          <div className="as-timeline">
            {runs.map(run => (
              <div key={run.id} className={`as-run ${run.type}`}>
                <div className="as-run-node">
                  <div className="as-run-node-dot" />
                </div>
                <div className="as-run-body">
                  <div className="as-run-hd">
                    <span className="as-run-time">{run.timestamp}</span>
                    <span className="as-run-label">{run.label}</span>
                    <span className="as-run-since">{formatSince(run.timestamp)}</span>
                  </div>
                  <div className="as-run-msg" dangerouslySetInnerHTML={{ __html: run.message.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />

                  {/* Live scanning status */}
                  {run.type === 'live' && (
                    <div className="as-run-status">
                      <div className="as-scanning">
                        <span className={`as-scan-src done`}>eBay ✓</span>
                        <span className={`as-scan-src done`}>Etsy ✓</span>
                        <span className={`as-scan-src active`}>FB Marketplace…</span>
                        <span className={`as-scan-src pending`}>Craigslist</span>
                      </div>
                    </div>
                  )}

                  {/* Finds preview */}
                  {run.finds && run.finds.length > 0 && (
                    <div className="as-finds-row">
                      {run.finds.slice(0, 3).map(find => (
                        <div key={find.id} className={`as-find ${find.source}`}>
                          <div className="as-find-thumb">
                            <div className="as-find-strip" />
                            <BrandMark size={18} />
                          </div>
                          <span className={`as-find-sc ${find.score >= 90 ? 's90' : find.score >= 75 ? 's75' : 's60'}`}>
                            {find.score}
                          </span>
                          <span className="as-find-ti">{find.title}</span>
                          <span className="as-find-pr">${find.price}</span>
                        </div>
                      ))}
                      {run.finds.length > 3 && (
                        <button className="as-find-more">
                          +{run.finds.length - 3} more
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M9 6 L15 12 L9 18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Rules Panel */}
        <div className="as-rules-side">
          {/* The Brief */}
          <div className="as-rules-block">
            <div className="as-rules-hd">
              <div className="as-rules-ti">The brief</div>
              <button className="as-rules-edit">Edit</button>
            </div>
            <div className="as-rule">
              <div className="as-rule-lab">What scout's hunting for</div>
              <div className="as-rule-val">
                <div className="as-rule-main">{rules.brief}</div>
              </div>
            </div>
            <div className="as-kw-chips">
              {rules.keywords.map(kw => (
                <span key={kw} className="as-kw-chip">
                  {kw}
                  <span className="as-kw-x">×</span>
                </span>
              ))}
            </div>
            <div className="as-kw-chips" style={{ marginTop: 6 }}>
              {rules.excludes.map(ex => (
                <span key={ex} className="as-kw-chip exclude">
                  {ex}
                  <span className="as-kw-x">×</span>
                </span>
              ))}
              <span className="as-kw-chip exclude add">+ add exclude</span>
            </div>
          </div>

          {/* Budget */}
          <div className="as-rules-block">
            <div className="as-rules-hd">
              <div className="as-rules-ti">Budget · per item</div>
              <button className="as-rules-edit">Edit</button>
            </div>
            <div className="as-rule">
              <div className="as-rule-lab">Max scout will surface</div>
              <div className="as-rule-val">
                <span className="as-rule-main">${rules.budgetSoft}</span>
                <span className="as-rule-sub">soft cap · ${rules.budgetHard} hard ceiling</span>
              </div>
            </div>
          </div>

          {/* Threshold */}
          <div className="as-rules-block">
            <div className="as-rules-hd">
              <div className="as-rules-ti">Score threshold</div>
            </div>
            <div className="as-threshold">
              <div className="as-threshold-track">
                <div className="as-threshold-fill" style={{ width: '60%' }} />
                <div className="as-threshold-handle" style={{ left: '60%' }} />
              </div>
              <div className="as-threshold-marks">
                <span>50</span>
                <span>65</span>
                <span>75</span>
                <span>85</span>
                <span>95</span>
              </div>
              <div className="as-threshold-current">
                Surface scores <b>{rules.threshold} and above</b> · notify at <b>{rules.notifyAt}+</b>
              </div>
            </div>
          </div>

          {/* Marketplaces */}
          <div className="as-rules-block">
            <div className="as-rules-hd">
              <div className="as-rules-ti">Marketplaces</div>
              <button className="as-rules-edit">All on</button>
            </div>
            <div className="as-src-toggles">
              {[
                { id: 'ebay', name: 'eBay', sub: '12 finds · 7d' },
                { id: 'etsy', name: 'Etsy', sub: '8 finds · 7d' },
                { id: 'facebook', name: 'FB Marketplace', sub: 'local · 50mi' },
                { id: 'craigslist', name: 'Craigslist', sub: 'muted' }
              ].map(src => (
                <div key={src.id} className={`as-src-row ${src.id} ${!rules.sources[src.id as keyof typeof rules.sources] ? 'off' : ''}`}>
                  <span className="as-src-strip" />
                  <span className="as-src-nm">{src.name}</span>
                  <span className="as-src-sub">{src.sub}</span>
                  <div className={`as-toggle-sm ${rules.sources[src.id as keyof typeof rules.sources] ? 'on' : ''}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="as-rules-block">
            <div className="as-rules-hd">
              <div className="as-rules-ti">Schedule</div>
              <button className="as-rules-edit">Edit</button>
            </div>
            <div className="as-schedule-grid">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className={`as-day ${rules.schedule.days[i] ? 'on' : ''}`}>{day}</div>
              ))}
            </div>
            <div className="as-schedule-time">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7 L12 12 L15 14"/>
              </svg>
              <span className="as-schedule-val">{rules.schedule.times.join(' · ')}</span>
              <span className="as-schedule-freq">{rules.schedule.times.length}× / day</span>
            </div>
          </div>

          {/* Pause Button */}
          <div className="as-pause-row">
            <button className="as-btn-pause">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="5" width="4" height="14" rx="1"/>
                <rect x="14" y="5" width="4" height="14" rx="1"/>
              </svg>
              Pause for a week
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutoScoutPage;
