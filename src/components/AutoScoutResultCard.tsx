import { useNavigate } from 'react-router-dom';
import { BrandMark } from './ui/Icons';

interface AutoScoutFind {
  id: string;
  title: string;
  price: number;
  score: number;
  source: 'ebay' | 'etsy' | 'facebook' | 'craigslist';
  isNew?: boolean;
}

interface AutoScoutResultCardProps {
  timestamp: string;
  message: string;
  finds: AutoScoutFind[];
  projectId?: string;
}

export function AutoScoutResultCard({ timestamp, message, finds, projectId }: AutoScoutResultCardProps) {
  const navigate = useNavigate();

  const handleOpenInScout = () => {
    if (projectId) {
      navigate(`/projects/${projectId}/auto-scout`);
    } else {
      navigate('/auto-scout');
    }
  };

  return (
    <div className="as-inline-card">
      <div className="as-inline-top">
        <div className="as-inline-mk">
          <BrandMark size={13} />
        </div>
        <div className="as-inline-body">
          <div className="as-inline-ti">Auto-scout · {timestamp}</div>
          <div className="as-inline-msg" dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        <button className="as-inline-open" onClick={handleOpenInScout}>
          Open in scout
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12 L19 12 M13 6 L19 12 L13 18"/>
          </svg>
        </button>
      </div>
      <div className="as-inline-finds">
        {finds.slice(0, 3).map(find => (
          <div key={find.id} className={`as-inline-find ${find.source}`}>
            <div className="as-inline-find-strip" />
            <div className="as-inline-find-img">
              {find.isNew && <span className="as-inline-find-new">New</span>}
              <span className="as-inline-find-sc">{find.score}</span>
              <BrandMark size={36} />
            </div>
            <div className="as-inline-find-info">
              <div className="as-inline-find-nm">{find.title}</div>
              <div className="as-inline-find-pr-row">
                <span className="as-inline-find-pr">${find.price}</span>
                <span className="as-inline-find-src" style={{ color: getSourceColor(find.source) }}>
                  {formatSourceName(find.source)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSourceColor(source: string): string {
  switch (source) {
    case 'ebay': return '#F0997B';
    case 'etsy': return '#F09595';
    case 'facebook': return '#85B7EB';
    case 'craigslist': return '#AFA9EC';
    default: return '#a8a29e';
  }
}

function formatSourceName(source: string): string {
  switch (source) {
    case 'ebay': return 'eBay';
    case 'etsy': return 'Etsy';
    case 'facebook': return 'FB';
    case 'craigslist': return 'CL';
    default: return source;
  }
}

export default AutoScoutResultCard;
