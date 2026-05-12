import { useState, useEffect } from 'react';

// Hunt settings interface
export interface HuntSettings {
  sources: {
    ebay: boolean;
    etsy: boolean;
    facebook: boolean;
    craigslist: boolean;
  };
  priceMin: number | null;
  priceMax: number | null;
  listingAge: '24h' | '3d' | '7d' | '30d' | 'any';
  location: string;
  zipCode: string;
  distance: number; // in miles
  condition: {
    vintage: boolean;
    refurbished: boolean;
    new: boolean;
    forParts: boolean;
  };
}

export const defaultHuntSettings: HuntSettings = {
  sources: {
    ebay: true,
    etsy: true,
    facebook: true,
    craigslist: true,
  },
  priceMin: null,
  priceMax: null,
  listingAge: 'any',
  location: 'Los Angeles, CA',
  zipCode: '90049',
  distance: 25,
  condition: {
    vintage: true,
    refurbished: true,
    new: false,
    forParts: false,
  },
};

interface HuntSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: HuntSettings;
  onSettingsChange: (settings: HuntSettings) => void;
  projectName?: string;
}

// Icons
function IconClose({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </svg>
  );
}

function IconGear({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1 L12 4 M12 20 L12 23 M4.2 4.2 L6.3 6.3 M17.7 17.7 L19.8 19.8 M1 12 L4 12 M20 12 L23 12 M4.2 19.8 L6.3 17.7 M17.7 6.3 L19.8 4.2" />
    </svg>
  );
}

function IconInfo({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8 L12 12 M12 16 L12 16.01" />
    </svg>
  );
}

function IconPin({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2 C8 2 5 5 5 9 c0 5 7 13 7 13 s7-8 7-13 c0-4-3-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function IconCheck({ size = 9 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M5 12 L10 17 L19 7" />
    </svg>
  );
}

// Toggle component
function Toggle({ on, onChange }: { on: boolean; onChange: (value: boolean) => void }) {
  return (
    <div
      className={`hs-toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
    />
  );
}

export function HuntSettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  projectName = 'Project',
}: HuntSettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<HuntSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const updateSetting = <K extends keyof HuntSettings>(key: K, value: HuntSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateSource = (source: keyof HuntSettings['sources'], value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      sources: { ...prev.sources, [source]: value },
    }));
  };

  const updateCondition = (cond: keyof HuntSettings['condition'], value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      condition: { ...prev.condition, [cond]: value },
    }));
  };

  const handleApply = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(defaultHuntSettings);
  };

  const activeSourceCount = Object.values(localSettings.sources).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="hs-overlay">
      <div className="hs-scrim" onClick={onClose} />
      <div className="hs-panel">
        {/* Header */}
        <div className="hs-panel-hd">
          <div className="hs-mk">
            <IconGear size={14} />
          </div>
          <div className="hs-ti">
            <div className="hs-eyebrow">Hunt settings</div>
            <div className="hs-h">Tune <em>this hunt</em></div>
          </div>
          <button className="hs-close" onClick={onClose}>
            <IconClose size={13} />
          </button>
        </div>

        {/* Inherit banner */}
        <div className="hs-inherit">
          <span className="hs-inherit-ico">
            <IconInfo size={13} />
          </span>
          <div className="hs-inherit-body">
            Defaults inherit from <b>{projectName}</b>. Changes here apply only to this hunt.
            <span className="hs-inherit-reset" onClick={handleReset}> Reset all to project defaults</span>
          </div>
        </div>

        {/* Body */}
        <div className="hs-panel-body">
          {/* Marketplaces */}
          <div className="hs-ctrl-block">
            <div className="hs-ctrl-hd">
              <div className="hs-ctrl-lbl">
                <span className="hs-pip" />
                Marketplaces
              </div>
              <span className="hs-ctrl-source">{activeSourceCount} of 4</span>
            </div>
            <div className="hs-src-grid">
              <div className={`hs-src-row ebay ${!localSettings.sources.ebay ? 'off' : ''}`}>
                <span className="hs-src-strip" />
                <div className="hs-src-info">
                  <span className="hs-src-nm">eBay</span>
                  <span className="hs-src-meta">global · ship to LA</span>
                </div>
                <Toggle on={localSettings.sources.ebay} onChange={(v) => updateSource('ebay', v)} />
              </div>
              <div className={`hs-src-row etsy ${!localSettings.sources.etsy ? 'off' : ''}`}>
                <span className="hs-src-strip" />
                <div className="hs-src-info">
                  <span className="hs-src-nm">Etsy</span>
                  <span className="hs-src-meta">global · ship to LA</span>
                </div>
                <Toggle on={localSettings.sources.etsy} onChange={(v) => updateSource('etsy', v)} />
              </div>
              <div className={`hs-src-row fb ${!localSettings.sources.facebook ? 'off' : ''}`}>
                <span className="hs-src-strip" />
                <div className="hs-src-info">
                  <span className="hs-src-nm">FB Marketplace</span>
                  <span className="hs-src-meta">local · {localSettings.distance}mi</span>
                </div>
                <Toggle on={localSettings.sources.facebook} onChange={(v) => updateSource('facebook', v)} />
              </div>
              <div className={`hs-src-row cl ${!localSettings.sources.craigslist ? 'off' : ''}`}>
                <span className="hs-src-strip" />
                <div className="hs-src-info">
                  <span className="hs-src-nm">Craigslist</span>
                  <span className="hs-src-meta">{localSettings.sources.craigslist ? `local · ${localSettings.distance}mi` : 'muted'}</span>
                </div>
                <Toggle on={localSettings.sources.craigslist} onChange={(v) => updateSource('craigslist', v)} />
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="hs-ctrl-block">
            <div className="hs-ctrl-hd">
              <div className="hs-ctrl-lbl">
                <span className="hs-pip" />
                Price range
              </div>
            </div>
            <div className="hs-price-range">
              <div className="hs-price-inputs">
                <div className="hs-price-input-wrap">
                  <span className="hs-price-label">Min</span>
                  <div className="hs-price-input">
                    <span className="hs-price-sign">$</span>
                    <input
                      type="number"
                      value={localSettings.priceMin || ''}
                      placeholder="0"
                      onChange={(e) => updateSetting('priceMin', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                </div>
                <div className="hs-price-input-wrap">
                  <span className="hs-price-label">Max</span>
                  <div className="hs-price-input">
                    <span className="hs-price-sign">$</span>
                    <input
                      type="number"
                      value={localSettings.priceMax || ''}
                      placeholder="Any"
                      onChange={(e) => updateSetting('priceMax', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Listing Age */}
          <div className="hs-ctrl-block">
            <div className="hs-ctrl-hd">
              <div className="hs-ctrl-lbl">
                <span className="hs-pip" />
                Listing age
              </div>
            </div>
            <div className="hs-pill-row">
              {(['24h', '3d', '7d', '30d', 'any'] as const).map((age) => (
                <button
                  key={age}
                  className={`hs-pill ${localSettings.listingAge === age ? 'on' : ''}`}
                  onClick={() => updateSetting('listingAge', age)}
                >
                  {age === '24h' ? '24 hours' :
                   age === '3d' ? '3 days' :
                   age === '7d' ? '7 days' :
                   age === '30d' ? '30 days' : 'Any'}
                </button>
              ))}
            </div>
            <div className="hs-ctrl-hint">Tighter recency means fresher listings, fewer results.</div>
          </div>

          {/* Location */}
          <div className="hs-ctrl-block">
            <div className="hs-ctrl-hd">
              <div className="hs-ctrl-lbl">
                <span className="hs-pip unchanged" />
                Location
              </div>
              <span className="hs-ctrl-source">from account</span>
            </div>
            <div className="hs-loc-grid">
              <div className="hs-loc-input">
                <IconPin size={13} />
                <input
                  value={localSettings.location}
                  onChange={(e) => updateSetting('location', e.target.value)}
                  placeholder="City, State"
                />
              </div>
              <div className="hs-loc-input">
                <input
                  value={localSettings.zipCode}
                  onChange={(e) => updateSetting('zipCode', e.target.value)}
                  placeholder="ZIP"
                />
              </div>
            </div>
            <div className="hs-ctrl-hint">Affects local-pickup sources (FB Marketplace, Craigslist).</div>
          </div>

          {/* Distance */}
          <div className="hs-ctrl-block">
            <div className="hs-ctrl-hd">
              <div className="hs-ctrl-lbl">
                <span className="hs-pip" />
                Local pickup radius
              </div>
            </div>
            <div className="hs-dist-block">
              <div className="hs-dist-hd">
                <span className="hs-dist-label">Within radius of zip</span>
                <span className="hs-dist-value">{localSettings.distance} mi</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={localSettings.distance}
                onChange={(e) => updateSetting('distance', parseInt(e.target.value))}
                className="hs-dist-slider"
              />
              <div className="hs-dist-marks">
                <span>5</span>
                <span>25</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Condition */}
          <div className="hs-ctrl-block">
            <div className="hs-ctrl-hd">
              <div className="hs-ctrl-lbl">
                <span className="hs-pip unchanged" />
                Condition
              </div>
            </div>
            <div className="hs-cond-row">
              <button
                className={`hs-cond-pill ${localSettings.condition.vintage ? 'on' : ''}`}
                onClick={() => updateCondition('vintage', !localSettings.condition.vintage)}
              >
                <span className="hs-cond-check">
                  {localSettings.condition.vintage && <IconCheck size={9} />}
                </span>
                <span className="hs-cond-nm">Vintage / used</span>
              </button>
              <button
                className={`hs-cond-pill ${localSettings.condition.refurbished ? 'on' : ''}`}
                onClick={() => updateCondition('refurbished', !localSettings.condition.refurbished)}
              >
                <span className="hs-cond-check">
                  {localSettings.condition.refurbished && <IconCheck size={9} />}
                </span>
                <span className="hs-cond-nm">Refurbished</span>
              </button>
              <button
                className={`hs-cond-pill ${localSettings.condition.new ? 'on' : ''}`}
                onClick={() => updateCondition('new', !localSettings.condition.new)}
              >
                <span className="hs-cond-check">
                  {localSettings.condition.new && <IconCheck size={9} />}
                </span>
                <span className="hs-cond-nm">New / repro</span>
              </button>
              <button
                className={`hs-cond-pill ${localSettings.condition.forParts ? 'on' : ''}`}
                onClick={() => updateCondition('forParts', !localSettings.condition.forParts)}
              >
                <span className="hs-cond-check">
                  {localSettings.condition.forParts && <IconCheck size={9} />}
                </span>
                <span className="hs-cond-nm">For parts</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="hs-panel-foot">
          <button className="hs-save-default">
            <IconCheck size={11} />
            Save as project default
          </button>
          <button className="hs-apply" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// Override chips component for composer
interface OverrideChipsProps {
  settings: HuntSettings;
  defaults: HuntSettings;
  onRemoveOverride: (key: string) => void;
  onResetAll: () => void;
}

export function OverrideChips({ settings, defaults, onRemoveOverride, onResetAll }: OverrideChipsProps) {
  const overrides: { key: string; label: string; value: string; icon: React.ReactNode }[] = [];

  // Check sources
  const activeSourceCount = Object.values(settings.sources).filter(Boolean).length;
  const defaultSourceCount = Object.values(defaults.sources).filter(Boolean).length;
  if (activeSourceCount !== defaultSourceCount ||
      JSON.stringify(settings.sources) !== JSON.stringify(defaults.sources)) {
    const sourceNames = Object.entries(settings.sources)
      .filter(([, v]) => v)
      .map(([k]) => k === 'facebook' ? 'FB' : k.charAt(0).toUpperCase() + k.slice(1));
    overrides.push({
      key: 'sources',
      label: 'Sources',
      value: sourceNames.length <= 2 ? sourceNames.join(', ') : `${activeSourceCount} of 4`,
      icon: (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M16 16 L21 21" />
        </svg>
      ),
    });
  }

  // Check price
  if (settings.priceMin !== defaults.priceMin || settings.priceMax !== defaults.priceMax) {
    let priceStr = '';
    if (settings.priceMin && settings.priceMax) {
      priceStr = `$${settings.priceMin}–$${settings.priceMax}`;
    } else if (settings.priceMin) {
      priceStr = `$${settings.priceMin}+`;
    } else if (settings.priceMax) {
      priceStr = `Up to $${settings.priceMax}`;
    }
    if (priceStr) {
      overrides.push({
        key: 'price',
        label: 'Price',
        value: priceStr,
        icon: (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10 L21 10" />
          </svg>
        ),
      });
    }
  }

  // Check listing age
  if (settings.listingAge !== defaults.listingAge) {
    const ageLabels: Record<string, string> = {
      '24h': '24 hours',
      '3d': '3 days',
      '7d': '7 days',
      '30d': '30 days',
      'any': 'Any age',
    };
    overrides.push({
      key: 'listingAge',
      label: 'Recency',
      value: ageLabels[settings.listingAge],
      icon: (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7 L12 12 L15 14" />
        </svg>
      ),
    });
  }

  // Check distance
  if (settings.distance !== defaults.distance) {
    overrides.push({
      key: 'distance',
      label: 'Within',
      value: `${settings.distance} mi`,
      icon: (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 C8 2 5 5 5 9 c0 5 7 13 7 13 s7-8 7-13 c0-4-3-7-7-7z" />
          <circle cx="12" cy="9" r="2" />
        </svg>
      ),
    });
  }

  // Check location/zip
  if (settings.zipCode !== defaults.zipCode) {
    overrides.push({
      key: 'zipCode',
      label: 'ZIP',
      value: settings.zipCode,
      icon: (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
        </svg>
      ),
    });
  }

  if (overrides.length === 0) return null;

  return (
    <div className="hs-overrides-row">
      <span className="hs-overrides-label">
        <span className="hs-overrides-dot" />
        {overrides.length === 1 ? 'Override' : 'Overriding defaults'}
      </span>
      {overrides.map((override) => (
        <span key={override.key} className="hs-override-chip">
          {override.icon}
          <span className="hs-override-lab">{override.label}</span>
          <span className="hs-override-val">{override.value}</span>
          <span className="hs-override-x" onClick={() => onRemoveOverride(override.key)}>×</span>
        </span>
      ))}
      {overrides.length > 1 && (
        <span className="hs-reset-link" onClick={onResetAll}>Reset all</span>
      )}
    </div>
  );
}

export default HuntSettingsPanel;
