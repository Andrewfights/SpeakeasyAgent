import { useState, useRef, useEffect } from 'react';
import { IconHeart, IconHeartFilled } from './ui/Icons';
import ListingDetail from './ListingDetail';

export interface CarouselItem {
  id: string;
  title: string;
  price: number;
  source: 'ebay' | 'etsy' | 'facebook' | 'craigslist';
  listing_url: string;
  image_url?: string;
  overall_score?: number;
  location?: string;
  seller_rating?: string;
  seller_reviews?: number;
  badge?: string;
  distance?: string;
  is_saved?: boolean;
}

interface ListingCarouselProps {
  items: CarouselItem[];
  category?: string;
  onSave?: (itemId: string) => void;
  onRefine?: (filter: string) => void;
  moreCount?: number;
}

// Chevron icons
function IconChevronLeft({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18 L9 12 L15 6"/>
    </svg>
  );
}

function IconChevronRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6 L15 12 L9 18"/>
    </svg>
  );
}

function IconLocation({ size = 9 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2 C8 2 5 5 5 9 c0 5 7 13 7 13 s7-8 7-13 c0-4-3-7-7-7z"/>
      <circle cx="12" cy="9" r="2" fill="currentColor"/>
    </svg>
  );
}

function getScoreTier(score?: number) {
  if (!score) return 'tier-3';
  if (score >= 90) return 'tier-1';
  if (score >= 75) return 'tier-2';
  return 'tier-3';
}

function getSourceTag(source: string) {
  const tags: Record<string, string> = {
    ebay: 'eBay',
    etsy: 'Etsy',
    facebook: 'FB',
    craigslist: 'Craigslist'
  };
  return tags[source] || source;
}

export function ListingCarousel({
  items,
  category = 'Items',
  onSave,
  onRefine,
  moreCount = 0
}: ListingCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set(
    items.filter(i => i.is_saved).map(i => i.id)
  ));
  const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateScroll = () => {
      setScrollPos(rail.scrollLeft);
      setMaxScroll(rail.scrollWidth - rail.clientWidth);
    };

    updateScroll();
    rail.addEventListener('scroll', updateScroll);
    window.addEventListener('resize', updateScroll);
    return () => {
      rail.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, [items]);

  const scrollLeft = () => {
    railRef.current?.scrollBy({ left: -210, behavior: 'smooth' });
  };

  const scrollRight = () => {
    railRef.current?.scrollBy({ left: 210, behavior: 'smooth' });
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    onSave?.(id);
  };

  const openListing = (item: CarouselItem) => {
    setSelectedItem(item);
  };

  const closeDetail = () => {
    setSelectedItem(null);
  };

  // Calculate stats
  const prices = items.map(i => i.price).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgScore = items.length > 0
    ? Math.round(items.reduce((sum, i) => sum + (i.overall_score || 0), 0) / items.length)
    : 0;

  // Calculate progress
  const progressPercent = maxScroll > 0 ? Math.round((scrollPos / maxScroll) * 100) : 0;
  const visibleIndex = Math.floor(scrollPos / 210) + 1;

  return (
    <div className="listing-carousel">
      {/* Header */}
      <div className="carousel-header">
        <div className="carousel-header-left">
          <span className="carousel-label">{category} · {items.length} finds</span>
          {prices.length > 0 && (
            <span className="carousel-stats">
              <b>${minPrice}</b> – <b>${maxPrice}</b>
              {avgScore > 0 && <> · avg score <b>{avgScore}</b></>}
            </span>
          )}
        </div>
        <div className="carousel-arrows">
          <button
            className="carousel-arrow"
            onClick={scrollLeft}
            disabled={scrollPos <= 0}
            aria-label="Scroll left"
          >
            <IconChevronLeft />
          </button>
          <button
            className="carousel-arrow"
            onClick={scrollRight}
            disabled={scrollPos >= maxScroll - 1}
            aria-label="Scroll right"
          >
            <IconChevronRight />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="carousel-wrap">
        <div className="carousel-rail" ref={railRef}>
          {items.map(item => (
            <div
              key={item.id}
              className={`carousel-card ${item.source}`}
              onClick={() => openListing(item)}
            >
              <div className="carousel-card-strip" />
              <div className="carousel-card-img">
                {/* Heart button */}
                <button
                  className={`carousel-card-heart ${savedItems.has(item.id) ? 'saved' : ''}`}
                  onClick={(e) => toggleSave(item.id, e)}
                  aria-label={savedItems.has(item.id) ? 'Remove from saved' : 'Save item'}
                >
                  {savedItems.has(item.id) ? (
                    <IconHeartFilled size={12} />
                  ) : (
                    <IconHeart size={12} />
                  )}
                </button>

                {/* Score badge */}
                {item.overall_score && (
                  <span className="carousel-card-score">
                    <span className={`score-badge ${getScoreTier(item.overall_score)}`}>
                      {item.overall_score}
                    </span>
                  </span>
                )}

                {/* Actual image or placeholder */}
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="carousel-card-image"
                    onError={(e) => {
                      // Hide broken image and show placeholder
                      (e.target as HTMLImageElement).style.display = 'none';
                      const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                      if (placeholder) (placeholder as HTMLElement).style.display = 'block';
                    }}
                  />
                ) : null}
                {/* Placeholder SVG (shown if no image or image fails) */}
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  aria-hidden="true"
                  style={{ display: item.image_url ? 'none' : 'block' }}
                >
                  <g fill="none" stroke="var(--color-dim)" strokeWidth="1">
                    <rect x="20" y="20" width="40" height="40" rx="4" />
                    <circle cx="32" cy="35" r="4" />
                    <path d="M20 50 L35 40 L45 48 L60 35 L60 55 A4 4 0 0 1 56 59 L24 59 A4 4 0 0 1 20 55 Z" />
                  </g>
                </svg>

                {/* Badge */}
                {(item.badge || item.distance) && (
                  <span className={`carousel-card-badge ${item.distance ? 'warn' : ''}`}>
                    {item.distance && <IconLocation />}
                    {item.distance || item.badge}
                  </span>
                )}
              </div>

              <div className="carousel-card-info">
                <div className="carousel-card-title">{item.title}</div>
                <div className="carousel-card-row">
                  <span className="carousel-card-price">${item.price}</span>
                  <span className={`source-tag ${item.source}`}>{getSourceTag(item.source)}</span>
                </div>
                <div className="carousel-card-meta">
                  {item.seller_rating && (
                    <>
                      <span className="stars">{item.seller_rating}</span>
                      {item.seller_reviews && <span>{item.seller_reviews.toLocaleString()}</span>}
                      <span className="dot" />
                    </>
                  )}
                  {item.location && <span>{item.location}</span>}
                </div>
              </div>
            </div>
          ))}

          {/* End card */}
          {moreCount > 0 && (
            <div className="carousel-card end-card">
              <span className="num">+{moreCount}</span>
              <span className="lbl">More finds</span>
              <span className="sub">Tap to see the full set in today's finds</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="carousel-progress">
          <span className="carousel-progress-pos">
            <b>{String(visibleIndex).padStart(2, '0')}</b> / {String(items.length).padStart(2, '0')}
          </span>
          <div className="carousel-progress-track">
            <div
              className="carousel-progress-fill"
              style={{ width: `${Math.max(15, progressPercent)}%` }}
            />
          </div>
          <span className="carousel-progress-pos">scroll →</span>
        </div>
      </div>

      {/* Refine pills */}
      {onRefine && (
        <div className="carousel-refine">
          <span className="carousel-refine-label">Refine</span>
          <button className="carousel-refine-pill active" onClick={() => onRefine('all')}>
            All · {items.length}
          </button>
          <button className="carousel-refine-pill" onClick={() => onRefine('under-150')}>
            Under $150
          </button>
          <button className="carousel-refine-pill" onClick={() => onRefine('local')}>
            Local only
          </button>
          <button className="carousel-refine-pill" onClick={() => onRefine('top-rated')}>
            Top rated
          </button>
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedItem && (
        <ListingDetail
          item={{
            id: selectedItem.id,
            title: selectedItem.title,
            price: selectedItem.price,
            source: selectedItem.source,
            listing_url: selectedItem.listing_url,
            image_url: selectedItem.image_url,
            overall_score: selectedItem.overall_score || 75,
            location: selectedItem.location,
            is_saved: savedItems.has(selectedItem.id)
          }}
          onClose={closeDetail}
          onSave={(projectId) => {
            setSavedItems(prev => new Set(prev).add(selectedItem.id));
            onSave?.(selectedItem.id);
          }}
        />
      )}
    </div>
  );
}

export default ListingCarousel;
