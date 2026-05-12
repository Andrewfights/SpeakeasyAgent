import { useState } from 'react';
import { DiamondIcon, IconHeart, IconArrowLeft, IconExternalLink } from './ui/Icons';
import SaveToProjectPicker from './SaveToProjectPicker';

interface ListingDetailProps {
  item: {
    id: string;
    title: string;
    price: number;
    source: string;
    listing_url: string;
    image_url?: string;
    overall_score: number;
    location?: string;
    description?: string;
    is_saved?: boolean;
  };
  projectName?: string;
  projectColor?: string;
  onClose: () => void;
  onSave?: (projectId: string) => void;
}

export function ListingDetail({ item, projectName, projectColor, onClose, onSave }: ListingDetailProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isSaved, setIsSaved] = useState(item.is_saved || false);
  const [showPicker, setShowPicker] = useState(false);
  const [savedToProject, setSavedToProject] = useState<string | null>(null);

  const scoreLabel = item.overall_score >= 90 ? 'Great deal' : item.overall_score >= 80 ? 'Good find' : 'Worth a look';
  const scoreColor = item.overall_score >= 90 ? '#a3d456' : item.overall_score >= 80 ? '#fbbf24' : '#a8a29e';

  const handleSave = () => {
    setShowPicker(true);
  };

  const handleProjectSelect = (projectId: string, projectName: string) => {
    setIsSaved(true);
    setSavedToProject(projectName);
    setShowPicker(false);
    onSave?.(projectId);
  };

  const handleOpenListing = () => {
    window.open(item.listing_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="detail-overlay">
      <div className="detail-frame">
        {/* Header bar */}
        <div className="detail-bar">
          <button className="detail-back" onClick={onClose}>
            <IconArrowLeft size={13} />
            <span>Back to chat</span>
          </button>
          {projectName && (
            <>
              <span className="detail-crumb-sep">/</span>
              <div className="detail-crumb-proj">
                <span className="detail-crumb-swatch" style={{ background: projectColor || '#7f1d1d' }} />
                {projectName}
              </div>
            </>
          )}
          <span className="detail-crumb-sep">/</span>
          <span className="detail-crumb-title">{item.title}</span>
          <div className="detail-actions">
            <button className="btn-icon" title="Share">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/>
                <path d="M8 11 L16 7 M8 13 L16 17"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="detail-body">
          {/* Gallery side */}
          <div className="detail-gallery">
            <div className="gallery-main">
              <div className="gallery-img-bg" />
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="gallery-main-img" />
              ) : (
                <div className="gallery-placeholder">
                  <DiamondIcon size={64} />
                </div>
              )}
              <button className="photo-nav photo-nav-l" onClick={() => setCurrentPhoto(Math.max(0, currentPhoto - 1))}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M15 18 L9 12 L15 6"/>
                </svg>
              </button>
              <button className="photo-nav photo-nav-r" onClick={() => setCurrentPhoto(currentPhoto + 1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 6 L15 12 L9 18"/>
                </svg>
              </button>
              <div className="photo-meta">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3"/>
                  <path d="M8 6 L9.5 4 L14.5 4 L16 6"/>
                </svg>
                <span>1 / 1</span>
              </div>
            </div>

            <div className="gallery-bottom">
              <div className="gauge-wrap">
                <svg width="56" height="56" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" stroke="#2a231d" strokeWidth="5" fill="none"/>
                  <circle
                    cx="32" cy="32" r="26"
                    stroke={scoreColor}
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray="163.36"
                    strokeDashoffset={163.36 - (163.36 * item.overall_score / 100)}
                    transform="rotate(-90 32 32)"
                    strokeLinecap="round"
                  />
                </svg>
                <div>
                  <div className="gauge-val">{item.overall_score}</div>
                  <div className="gauge-lbl">{scoreLabel}</div>
                </div>
              </div>
              <div className="gallery-divider" />
              <div className="price-info">
                <div className="price-val">${item.price}</div>
                {item.overall_score >= 85 && (
                  <div className="price-vs">Below market</div>
                )}
              </div>
              <button
                className={`btn-icon ${isSaved ? 'btn-icon-saved' : ''}`}
                onClick={handleSave}
                title="Save to project"
              >
                <IconHeart size={14} filled={isSaved} />
              </button>
            </div>
          </div>

          {/* Detail panel side */}
          <div className="detail-panel">
            <div className="detail-eyebrow">
              <span>{item.source}</span>
              <span className={`detail-src detail-src-${item.source.toLowerCase()}`}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '3px' }}>
                  <path d="M6 7 L18 7 M6 12 L18 12 M6 17 L14 17"/>
                </svg>
                {item.source}
              </span>
            </div>
            <h2 className="detail-h1">{item.title}</h2>
            <div className="detail-meta">
              {item.location && (
                <div className="detail-meta-item">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2 C8 2 5 5 5 9 c0 5 7 13 7 13 s7-8 7-13 c0-4-3-7-7-7z"/>
                  </svg>
                  {item.location}
                </div>
              )}
              <div className="detail-meta-item">Posted recently</div>
            </div>

            {/* Scout's analysis */}
            <div className="scout-analysis">
              <div className="scout-analysis-hd">
                <div className="scout-analysis-mk">
                  <DiamondIcon size={13} />
                </div>
                <div className="scout-analysis-ti">Scout's read</div>
              </div>
              <div className="analysis-line">
                This listing scores <strong>{item.overall_score}</strong> based on price, source reliability, and aesthetic fit.
                {item.overall_score >= 90 && ' This is a standout find worth acting on quickly.'}
                {item.overall_score >= 80 && item.overall_score < 90 && ' A solid option that fits your search criteria well.'}
                {item.overall_score < 80 && ' Worth considering, but may need closer inspection.'}
              </div>

              <div className="analysis-grid">
                <div className="analysis-cell">
                  <div className="analysis-lab">Aesthetic fit</div>
                  <div className={`analysis-val ${item.overall_score >= 85 ? 'analysis-val-good' : ''}`}>
                    {item.overall_score >= 90 ? 'Strong' : item.overall_score >= 80 ? 'Good' : 'Moderate'}
                  </div>
                </div>
                <div className="analysis-cell">
                  <div className="analysis-lab">Pricing</div>
                  <div className={`analysis-val ${item.overall_score >= 85 ? 'analysis-val-good' : ''}`}>
                    {item.overall_score >= 90 ? 'Great value' : item.overall_score >= 80 ? 'Fair' : 'Market rate'}
                  </div>
                </div>
                <div className="analysis-cell">
                  <div className="analysis-lab">Source</div>
                  <div className="analysis-val">{item.source}</div>
                </div>
                <div className="analysis-cell">
                  <div className="analysis-lab">Risk</div>
                  <div className={`analysis-val ${item.overall_score >= 85 ? 'analysis-val-good' : ''}`}>
                    {item.overall_score >= 85 ? 'Low' : 'Moderate'}
                  </div>
                </div>
              </div>

              {item.overall_score >= 90 && (
                <div className="callout callout-good">
                  <strong>High confidence pick.</strong> This item scores in the top tier for your search criteria.
                </div>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <div className="desc-block">
                <div className="desc-label">Seller description</div>
                <div className="desc-body">
                  <p>{item.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="detail-actions-bar">
          <button className="save-btn" onClick={handleSave}>
            <IconHeart size={14} filled={isSaved} />
            {isSaved ? (savedToProject ? `Saved to ${savedToProject}` : 'Saved') : 'Save to project'}
          </button>
          <button className="ext-btn" onClick={handleOpenListing}>
            <IconExternalLink size={14} />
            View on {item.source}
          </button>
          <button className="skip-btn" onClick={onClose}>
            Skip
          </button>
        </div>

        {/* Project Picker */}
        {showPicker && (
          <SaveToProjectPicker
            onSelect={handleProjectSelect}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  );
}

export default ListingDetail;
