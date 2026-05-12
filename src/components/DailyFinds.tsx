import { useState, useEffect } from 'react';
import { FilterPill, Button } from './ui';
import { ListingCard, ListingItem } from './ui/ListingCard';
import { IconBolt } from './ui/Icons';

export function DailyFinds({ projectId }: { projectId: string }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [items, setItems] = useState<ListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Fetch daily finds from API
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/projects/${projectId}/daily-finds`)
      .then(r => r.json())
      .then(data => {
        setItems(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => {
        setItems([]);
        setIsLoading(false);
      });
  }, [projectId]);

  const handleSave = async (item: ListingItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, saved: true, skipped: false } : i));
    await fetch(`/api/items/${item.id}/save`, { method: 'POST' });
  };

  const handleSkip = async (item: ListingItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, saved: false, skipped: true } : i));
    await fetch(`/api/items/${item.id}/skip`, { method: 'POST' });
  };

  const filteredItems = items.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'under100') return item.price < 100;
    if (item.category) return item.category.toLowerCase() === activeFilter;
    return true;
  });

  // Calculate dynamic filter counts
  const categories = items.reduce((acc, item) => {
    const cat = item.category?.toLowerCase() || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const under100Count = items.filter(i => i.price < 100).length;
  const greatDealsCount = items.filter(i => i.score && i.score >= 90).length;

  const filters = [
    { id: 'all', label: 'All', count: items.length },
    ...Object.entries(categories).map(([id, count]) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      count
    })),
    { id: 'under100', label: 'Under $100', count: under100Count, isSpecial: true },
  ];

  if (isLoading) {
    return (
      <div className="p-4 md:p-5 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse-dot inline-block w-2 h-2 rounded-full mb-4" style={{ background: 'var(--color-gold)' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading finds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-5 h-full overflow-auto">
      {/* Header */}
      <div className="eyebrow">{today}</div>
      <h1 className="heading-1 mt-1">Today's finds</h1>
      {items.length > 0 ? (
        <p className="caption mt-1">
          {items.length} new listings scouted overnight · {under100Count} below $100 · {greatDealsCount} great deals flagged
        </p>
      ) : (
        <p className="caption mt-1">Enable auto-scout to have items curated overnight</p>
      )}

      {/* Filter pills - only show if we have items */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.map(filter => (
            <FilterPill
              key={filter.id}
              active={activeFilter === filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={filter.isSpecial ? 'border-[var(--color-border-gold)] text-[var(--color-gold)]' : ''}
            >
              {filter.label}{filter.count ? ` · ${filter.count}` : ''}
            </FilterPill>
          ))}
        </div>
      )}

      {/* Grid of cards */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          {filteredItems.map(item => (
            <ListingCard
              key={item.id}
              item={item}
              onSave={handleSave}
              onSkip={handleSkip}
              onClick={(item) => {
                if (item.url) window.open(item.url, '_blank');
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState projectId={projectId} />
      )}
    </div>
  );
}

function EmptyState({ projectId }: { projectId: string }) {
  const [enabling, setEnabling] = useState(false);

  const handleEnableAutoScout = async () => {
    setEnabling(true);
    try {
      await fetch(`/api/projects/${projectId}/auto-scout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      });
      window.location.reload();
    } catch (err) {
      setEnabling(false);
    }
  };

  return (
    <div
      className="mt-6 rounded-lg flex flex-col items-center justify-center text-center py-16 px-4"
      style={{
        border: '1px dashed var(--color-border-strong)',
        background: 'var(--color-bg-card)'
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--color-gold-tint)', border: '0.5px solid var(--color-border-gold)' }}
      >
        <IconBolt size={20} style={{ color: 'var(--color-gold)' }} />
      </div>

      <h3
        className="text-sm font-medium mb-2"
        style={{ color: 'var(--color-cream)', fontFamily: 'var(--font-display)' }}
      >
        No automated finds yet
      </h3>
      <p
        className="text-sm max-w-xs mb-4"
        style={{ color: 'var(--color-muted)' }}
      >
        Enable auto-scout to have items curated overnight based on your style preferences.
      </p>

      <Button variant="gold-ghost" onClick={handleEnableAutoScout} disabled={enabling}>
        <IconBolt size={12} />
        {enabling ? 'Enabling...' : 'Enable auto-scout'}
      </Button>
    </div>
  );
}

export default DailyFinds;
