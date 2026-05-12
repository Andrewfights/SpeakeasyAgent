import { useState, useEffect } from 'react';
import { IconX } from './ui/Icons';

interface HuntSettings {
  zip_code?: string;
  search_radius: number;
  max_price?: number;
}

interface ChatSettingsProps {
  huntId: string;
  onClose: () => void;
  onSave?: () => void;
}

export function ChatSettings({ huntId, onClose, onSave }: ChatSettingsProps) {
  const [settings, setSettings] = useState<HuntSettings>({
    zip_code: '',
    search_radius: 50,
    max_price: undefined
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch current hunt settings
    fetch(`/api/hunts/${huntId}`)
      .then(r => r.json())
      .then(hunt => {
        setSettings({
          zip_code: hunt.zip_code || '',
          search_radius: hunt.search_radius || 50,
          max_price: hunt.max_price
        });
      })
      .catch(console.error);
  }, [huntId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/hunts/${huntId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      onSave?.();
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="chat-settings">
      <div className="chat-settings-header">
        <span className="chat-settings-title">Search Settings</span>
        <button className="chat-settings-close" onClick={onClose}>
          <IconX size={14} />
        </button>
      </div>

      <div className="chat-settings-body">
        <div className="chat-settings-field">
          <label className="input-label">ZIP Code</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. 90210"
            value={settings.zip_code || ''}
            onChange={(e) => setSettings({ ...settings, zip_code: e.target.value })}
            maxLength={10}
          />
          <p className="chat-settings-hint">Search for items near this location</p>
        </div>

        <div className="chat-settings-field">
          <label className="input-label">Search Radius</label>
          <div className="chat-settings-radius">
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={settings.search_radius}
              onChange={(e) => setSettings({ ...settings, search_radius: parseInt(e.target.value) })}
              className="chat-settings-slider"
            />
            <span className="chat-settings-radius-value">{settings.search_radius} mi</span>
          </div>
        </div>

        <div className="chat-settings-field">
          <label className="input-label">Max Price</label>
          <div className="chat-settings-price">
            <span className="chat-settings-price-symbol">$</span>
            <input
              type="number"
              className="input"
              placeholder="No limit"
              value={settings.max_price || ''}
              onChange={(e) => setSettings({ ...settings, max_price: e.target.value ? parseInt(e.target.value) : undefined })}
              min={0}
              step={10}
            />
          </div>
          <p className="chat-settings-hint">Only show items under this price</p>
        </div>
      </div>

      <div className="chat-settings-footer">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default ChatSettings;
