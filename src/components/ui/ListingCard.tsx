import React from 'react';
import { ScoreBadge } from './ScoreBadge';
import { IconHeart, IconHeartFilled, IconX } from './Icons';

export interface ListingItem {
  id: string;
  title: string;
  price: number;
  source: 'ebay' | 'etsy' | 'facebook' | 'craigslist' | string;
  score?: number;
  imageUrl?: string;
  url?: string;
  saved?: boolean;
  skipped?: boolean;
  category?: string;
  location?: string;
}

interface ListingCardProps {
  item: ListingItem;
  onSave?: (item: ListingItem) => void;
  onSkip?: (item: ListingItem) => void;
  onClick?: (item: ListingItem) => void;
  size?: 'sm' | 'md';
  className?: string;
}

function getSourceColor(source: string): string {
  const colors: Record<string, string> = {
    ebay: '#F0997B',
    etsy: '#F09595',
    facebook: '#85B7EB',
    fb: '#85B7EB',
    craigslist: '#AFA9EC',
    cl: '#AFA9EC'
  };
  return colors[source.toLowerCase()] || '#a8a29e';
}

function formatSource(source: string): string {
  const names: Record<string, string> = {
    ebay: 'eBay',
    etsy: 'Etsy',
    facebook: 'FB',
    fb: 'FB',
    craigslist: 'CL',
    cl: 'CL'
  };
  return names[source.toLowerCase()] || source;
}

export function ListingCard({
  item,
  onSave,
  onSkip,
  onClick,
  size = 'md',
  className = ''
}: ListingCardProps) {
  const isMd = size === 'md';

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.saved) {
      onSkip?.(item);
    } else {
      onSave?.(item);
    }
  };

  const cardState = item.skipped ? 'skipped' : item.saved ? 'saved' : '';

  return (
    <div
      className={`listing-card ${cardState} ${className}`}
      onClick={() => onClick?.(item)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div
        className="listing-card-img"
        style={{ height: isMd ? 88 : 58 }}
      >
        {/* Heart button */}
        <button
          className={`listing-card-heart ${item.saved ? 'active' : ''}`}
          onClick={handleHeartClick}
          style={{
            width: isMd ? 22 : 16,
            height: isMd ? 22 : 16,
            fontSize: isMd ? 11 : 8
          }}
        >
          {item.skipped ? (
            <IconX size={isMd ? 11 : 8} />
          ) : item.saved ? (
            <IconHeartFilled size={isMd ? 11 : 8} />
          ) : (
            <IconHeart size={isMd ? 11 : 8} />
          )}
        </button>

        {/* Score badge */}
        {item.score && (
          <div className="listing-card-score">
            <ScoreBadge score={item.score} size={isMd ? 'md' : 'sm'} />
          </div>
        )}

        {/* Placeholder SVG for image */}
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <PlaceholderImage size={isMd ? 64 : 42} />
        )}
      </div>

      <div className="listing-card-info" style={{ padding: isMd ? '8px 10px' : '5px 6px' }}>
        <div
          className="listing-card-title"
          style={{ fontSize: isMd ? 11.5 : 9 }}
        >
          {item.title}
        </div>
        <div className="listing-card-meta">
          <span
            className="listing-card-price"
            style={{ fontSize: isMd ? 12.5 : 10 }}
          >
            ${item.price}
          </span>
          <span
            className="listing-card-source"
            style={{
              fontSize: isMd ? 10.5 : 8,
              color: getSourceColor(item.source)
            }}
          >
            {formatSource(item.source)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Simple placeholder SVG when no image
function PlaceholderImage({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <g fill="none" stroke="#5a4720" strokeWidth="1.5">
        <ellipse cx="40" cy="22" rx="20" ry="6" fill="#3a2a05" />
        <path d="M40 28 L40 50" stroke="#b8860b" strokeWidth="3" />
        <path d="M28 64 L52 64 L48 70 L32 70 Z" fill="#b8860b" />
      </g>
    </svg>
  );
}

export default ListingCard;
