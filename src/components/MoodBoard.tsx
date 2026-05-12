import { useState, useEffect } from 'react';
import { FilterPill, Button } from './ui';
import { IconShare, IconLayoutGrid } from './ui/Icons';

interface MoodBoardItem {
  id: string;
  title: string;
  price: number;
  category: string;
  isPinned?: boolean;
  image_url?: string;
  listing_url?: string;
}

export function MoodBoard({ projectId }: { projectId: string }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [items, setItems] = useState<MoodBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch saved items from API
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/projects/${projectId}/saved-items`)
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

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MoodBoardItem[]>);

  // Calculate totals
  const totalCommitted = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalItems = items.length;

  // Get unique categories for filters
  const categories = Object.keys(groupedItems);
  const filters = [
    { id: 'all', label: 'All' },
    ...categories.map(cat => ({ id: cat.toLowerCase(), label: cat }))
  ];

  // Filter categories based on active filter
  const filteredCategories = activeFilter === 'all'
    ? Object.entries(groupedItems)
    : Object.entries(groupedItems).filter(([category]) =>
        category.toLowerCase() === activeFilter
      );

  if (isLoading) {
    return (
      <div className="p-4 md:p-5 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse-dot inline-block w-2 h-2 rounded-full mb-4" style={{ background: 'var(--color-gold)' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading saved items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-5 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="eyebrow">Mood board</div>
          <h1 className="heading-1 mt-1">{totalItems} saved items</h1>
        </div>
        <div className="text-right">
          <div
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-display)' }}
          >
            Total committed
          </div>
          <div
            className="text-xl font-medium tabular-nums"
            style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}
          >
            ${totalCommitted.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter pills - only show if we have items */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.map(filter => (
            <FilterPill
              key={filter.id}
              active={activeFilter === filter.id}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </FilterPill>
          ))}
        </div>
      )}

      {/* Categories */}
      {filteredCategories.length > 0 ? (
        <div className="space-y-5">
          {filteredCategories.map(([category, items]) => (
            <CategorySection key={category} title={category} items={items} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

interface CategorySectionProps {
  title: string;
  items: MoodBoardItem[];
}

function CategorySection({ title, items }: CategorySectionProps) {
  return (
    <div>
      {/* Category header */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--color-cream)', fontFamily: 'var(--font-display)' }}
        >
          {title}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-dim)' }}>
          {items.length} items
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: 'var(--color-border)' }}
        />
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map(item => (
          <MoodTile key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

interface MoodTileProps {
  item: MoodBoardItem;
}

function MoodTile({ item }: MoodTileProps) {
  return (
    <div className="mood-tile">
      {item.isPinned && (
        <span className="mood-tile-pin">★</span>
      )}
      <div className="mood-tile-img">
        <ItemPlaceholder category={item.category} />
      </div>
      <div className="mood-tile-info">
        <div className="mood-tile-title">{item.title}</div>
        <div className="mood-tile-price">${item.price}</div>
      </div>
    </div>
  );
}

function ItemPlaceholder({ category }: { category: string }) {
  // Different placeholder SVGs based on category
  switch (category) {
    case 'Seating':
      return (
        <svg width="42" height="42" viewBox="0 0 80 80">
          <g fill="#7f1d1d" stroke="#991b1b">
            <ellipse cx="40" cy="22" rx="22" ry="6" />
            <path d="M18 22 L18 38 Q40 44 62 38 L62 22" fill="#991b1b" />
            <path d="M22 38 L18 70 M58 38 L62 70" stroke="#fbbf24" strokeWidth="1.5" />
          </g>
        </svg>
      );
    case 'Lighting':
      return (
        <svg width="42" height="42" viewBox="0 0 80 80">
          <g fill="#fbbf24" stroke="#b8860b">
            <ellipse cx="40" cy="20" rx="20" ry="6" />
            <path d="M30 26 L30 54 L50 54 L50 26 Z" fill="none" strokeWidth="2" />
          </g>
        </svg>
      );
    case 'Barware':
      return (
        <svg width="42" height="42" viewBox="0 0 80 80">
          <g fill="#fefce8" stroke="#b8860b">
            <ellipse cx="40" cy="50" rx="16" ry="20" />
            <rect x="36" y="22" width="8" height="6" fill="#b8860b" />
          </g>
        </svg>
      );
    default:
      return (
        <svg width="42" height="42" viewBox="0 0 80 80">
          <g fill="#78350f" stroke="#fbbf24">
            <rect x="22" y="22" width="36" height="36" rx="4" />
          </g>
        </svg>
      );
  }
}

function EmptyState() {
  return (
    <div
      className="mt-4 rounded-lg flex flex-col items-center justify-center text-center py-16 px-4"
      style={{
        border: '1px dashed var(--color-border-strong)',
        background: 'var(--color-bg-card)'
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--color-gold-tint)', border: '0.5px solid var(--color-border-gold)' }}
      >
        <IconLayoutGrid size={20} style={{ color: 'var(--color-gold)' }} />
      </div>

      <h3
        className="text-sm font-medium mb-2"
        style={{ color: 'var(--color-cream)', fontFamily: 'var(--font-display)' }}
      >
        No items saved yet
      </h3>
      <p
        className="text-sm max-w-xs"
        style={{ color: 'var(--color-muted)' }}
      >
        Start scouting in Chat or browse Today's Finds to save items to your board.
      </p>
    </div>
  );
}

export default MoodBoard;
