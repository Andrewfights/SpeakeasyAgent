import { useState, memo } from 'react';
import { motion } from 'motion/react';
import { DiamondIcon, IconSearch, IconHeart, IconHeartFilled } from './ui/Icons';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ListingCard {
  id: string;
  source: 'ebay' | 'etsy' | 'facebook' | 'craigslist';
  title: string;
  price: number;
  score: number;
  url: string;
  image?: string;        // Single image (backwards compat)
  images?: string[];     // Multiple images for carousel
  badges?: string[];
  isSaved?: boolean;
}

export interface CalloutBlock {
  type: 'note' | 'good' | 'warn' | 'danger';
  content: string;
}

export interface LinkPill {
  source: 'ebay' | 'etsy' | 'facebook' | 'craigslist' | '1stdibs';
  label: string;
  url: string;
}

export interface CompSale {
  date: string;
  description: string;
  source: string;
  price: number;
  isThis?: boolean;
}

export interface FollowUp {
  label: string;
  icon?: 'search' | 'comps' | 'location' | 'seller' | 'save';
}

export interface SearchSource {
  name: string;
  state: 'done' | 'active' | 'pending';
  count?: number;
}

export interface SearchStatus {
  query: string;
  totalListings?: number;
  topCount?: number;
  sources: SearchSource[];
}

export interface SaveConfirmation {
  projectName: string;
  projectColor?: string;
  itemCount?: number;
  totalValue?: number;
}

// ============================================
// COMPONENT: Thinking State (A.01)
// ============================================

interface ThinkingStateProps {
  verb?: string;
  context?: string;
}

export function ThinkingState({ verb = 'Reading the brief', context }: ThinkingStateProps) {
  return (
    <div className="cr-thinking">
      <div className="cr-thinking-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span><em>{verb}</em>{context && ` — ${context}`}</span>
    </div>
  );
}

// ============================================
// COMPONENT: Search Status (A.02)
// ============================================

interface SearchStatusBlockProps {
  status: SearchStatus;
}

export function SearchStatusBlock({ status }: SearchStatusBlockProps) {
  return (
    <div className="cr-search-status">
      <div className="cr-search-hdr">
        <span className="cr-search-ic">
          <IconSearch size={13} />
        </span>
        <span className="cr-search-ti">Searching marketplaces</span>
        {status.totalListings && status.topCount && (
          <span className="cr-search-meta">{status.totalListings} listings → top {status.topCount}</span>
        )}
      </div>
      <div className="cr-search-query">{status.query}</div>
      <div className="cr-search-sources">
        {status.sources.map((src, i) => (
          <span key={i} className={`cr-search-src ${src.state}`}>
            {src.name}{src.state === 'done' && src.count ? ` ✓ ${src.count}` : src.state === 'active' ? '…' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPONENT: Results Header (A.03)
// ============================================

interface ResultsHeaderProps {
  label?: string;
  priceRange?: string;
  avgScore?: number;
}

export function ResultsHeader({ label = 'Top picks', priceRange, avgScore }: ResultsHeaderProps) {
  return (
    <div className="cr-results-hdr">
      <span>{label}</span>
      {(priceRange || avgScore) && (
        <div className="cr-results-meta">
          {priceRange}{avgScore && <> · avg score <b>{avgScore}</b></>}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENT: Listing Card Grid (A.03 & A.04)
// ============================================

interface ListingCardGridProps {
  items: ListingCard[];
  onSave?: (id: string) => void;
  onOpen?: (url: string) => void;
}

// Memoized grid to prevent re-renders on unrelated state changes
export const ListingCardGrid = memo(function ListingCardGrid({ items, onSave, onOpen }: ListingCardGridProps) {
  return (
    <div className="cr-cards">
      {items.slice(0, 3).map((item) => (
        <ListingCardItem key={item.id} item={item} onSave={onSave} onOpen={onOpen} />
      ))}
    </div>
  );
});

interface ListingCardItemProps {
  item: ListingCard;
  onSave?: (id: string) => void;
  onOpen?: (url: string) => void;
}

// Image Carousel Component for multiple listing images
interface ImageCarouselProps {
  images: string[];
  alt: string;
}

const ImageCarousel = memo(function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) return null;

  return (
    <div className="cr-carousel">
      <img
        src={images[currentIndex]}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
      {images.length > 1 && (
        <>
          <button className="cr-carousel-prev" onClick={goPrev} aria-label="Previous image">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 6 L9 12 L15 18" />
            </svg>
          </button>
          <button className="cr-carousel-next" onClick={goNext} aria-label="Next image">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 6 L15 12 L9 18" />
            </svg>
          </button>
          <div className="cr-carousel-dots">
            {images.map((_, i) => (
              <span
                key={i}
                className={i === currentIndex ? 'active' : ''}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});

// Memoized to prevent re-renders when parent state changes (e.g., search input)
const ListingCardItem = memo(function ListingCardItem({ item, onSave, onOpen }: ListingCardItemProps) {
  const [saved, setSaved] = useState(item.isSaved || false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
    onSave?.(item.id);
  };

  const scoreClass = item.score >= 90 ? 's90' : item.score >= 75 ? 's75' : 's60';

  return (
    <motion.div
      className={`cr-lc ${item.source}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      onClick={() => onOpen?.(item.url)}
      layoutId={item.id}
    >
      <div className="cr-lc-strip" />
      <div className="cr-lc-img">
        <div className="cr-lc-img-bg" />
        <button className={`cr-lc-heart ${saved ? 'on' : ''}`} onClick={handleSave}>
          {saved ? <IconHeartFilled size={11} /> : <IconHeart size={11} />}
        </button>
        <span className={`cr-lc-sc ${scoreClass}`}>{item.score}</span>
        {item.images && item.images.length > 0 ? (
          <ImageCarousel images={item.images} alt={item.title} />
        ) : item.image ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <DiamondIcon size={48} />
        )}
        {item.badges && item.badges.length > 0 && (
          <span className={`cr-lc-badge ${item.badges.includes('local') ? 'warn' : ''}`}>
            {item.badges[0]}
          </span>
        )}
      </div>
      <div className="cr-lc-info">
        <div className="cr-lc-ttl">{item.title}</div>
        <div className="cr-lc-pr-row">
          <span className="cr-lc-p">${item.price.toLocaleString()}</span>
          <span className="cr-lc-src-tag">{formatSourceName(item.source)}</span>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================
// COMPONENT: Prose (A.04)
// ============================================

interface ProseBlockProps {
  content: string;
}

export function ProseBlock({ content }: ProseBlockProps) {
  // Parse bold (**text**) and italic (*text*)
  const parts = parseProseFormatting(content);

  return (
    <div className="cr-prose">
      {parts.map((part, i) => {
        if (part.type === 'bold') {
          return <b key={i}>{part.text}</b>;
        } else if (part.type === 'italic') {
          return <em key={i}>{part.text}</em>;
        }
        return <span key={i}>{part.text}</span>;
      })}
    </div>
  );
}

// ============================================
// COMPONENT: Callouts (A.05)
// ============================================

interface CalloutProps {
  type: 'note' | 'good' | 'warn' | 'danger';
  content: string;
}

export function Callout({ type, content }: CalloutProps) {
  // Parse bold markers in content
  const parts = parseProseFormatting(content);

  return (
    <div className={`cr-callout ${type}`}>
      {parts.map((part, i) => {
        if (part.type === 'bold') {
          return <b key={i}>{part.text}</b>;
        }
        return <span key={i}>{part.text}</span>;
      })}
    </div>
  );
}

// ============================================
// COMPONENT: Link Pills (A.06)
// ============================================

interface LinkPillsProps {
  links: LinkPill[];
}

export function LinkPills({ links }: LinkPillsProps) {
  return (
    <div className="cr-links-row">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`cr-link-pill ${link.source}`}
        >
          <span className="cr-link-dot" />
          <span>{link.label}</span>
          <span className="cr-link-arrow">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M7 17 L17 7 M9 7 L17 7 L17 15"/>
            </svg>
          </span>
        </a>
      ))}
    </div>
  );
}

// ============================================
// COMPONENT: Comparable Sales Table (A.07)
// ============================================

interface CompsTableProps {
  sales: CompSale[];
  timeframe?: string;
}

export function CompsTable({ sales, timeframe = 'last 90 days' }: CompsTableProps) {
  return (
    <div className="cr-comps">
      <div className="cr-comps-hdr">
        <span>Comparable sales</span>
        <span className="cr-comps-meta">{timeframe} · {sales.length} results</span>
      </div>
      {sales.map((sale, i) => (
        <div key={i} className={`cr-comp-row ${sale.isThis ? 'this' : ''}`}>
          <span className="cr-comp-date">{sale.isThis ? 'This one' : sale.date}</span>
          <span className="cr-comp-desc">{sale.description}</span>
          <span className="cr-comp-src">{sale.source}</span>
          <span className="cr-comp-price">${sale.price}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// COMPONENT: Follow-up Suggestions (A.08)
// ============================================

interface FollowUpsProps {
  suggestions: FollowUp[];
  onSelect?: (label: string) => void;
}

export function FollowUps({ suggestions, onSelect }: FollowUpsProps) {
  return (
    <div className="cr-followups">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          className="cr-followup"
          onClick={() => onSelect?.(suggestion.label)}
        >
          <FollowUpIcon type={suggestion.icon} />
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}

function FollowUpIcon({ type }: { type?: string }) {
  switch (type) {
    case 'search':
      return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7"/><path d="M16 16 L21 21"/>
        </svg>
      );
    case 'comps':
      return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9 L21 9"/>
        </svg>
      );
    case 'location':
      return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 C8 2 5 5 5 9 c0 5 7 13 7 13 s7-8 7-13 c0-4-3-7-7-7z"/>
        </svg>
      );
    case 'seller':
      return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7 L21 7 L19 19 L5 19 Z M9 11 L9 15 M15 11 L15 15"/>
        </svg>
      );
    default:
      return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7"/><path d="M16 16 L21 21"/>
        </svg>
      );
  }
}

// ============================================
// COMPONENT: Save Confirmation (A.09)
// ============================================

interface SaveConfirmProps {
  projectName: string;
  projectColor?: string;
  onUndo?: () => void;
  followUp?: string;
}

export function SaveConfirm({ projectName, projectColor = '#7f1d1d', onUndo, followUp }: SaveConfirmProps) {
  return (
    <>
      <div className="cr-save-confirm">
        <span className="cr-save-ico">
          <IconHeartFilled size={13} />
        </span>
        <span className="cr-save-msg">
          Saved to <span className="cr-save-sw" style={{ background: projectColor }} />{projectName}
        </span>
        {onUndo && (
          <button className="cr-save-undo" onClick={onUndo}>Undo</button>
        )}
      </div>
      {followUp && <ProseBlock content={followUp} />}
    </>
  );
}

// ============================================
// COMPONENT: Dead End / No Results (A.10)
// ============================================

interface DeadEndProps {
  message: string;
  suggestions?: FollowUp[];
  onSelectSuggestion?: (label: string) => void;
}

export function DeadEnd({ message, suggestions, onSelectSuggestion }: DeadEndProps) {
  // Parse bold markers in message
  const parts = parseProseFormatting(message);

  return (
    <>
      <div className="cr-dead-end">
        <span className="cr-dead-ico">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="M16 16 L21 21 M8 11 L14 11"/>
          </svg>
        </span>
        <div className="cr-dead-body">
          <div className="cr-dead-ti">Nothing this round</div>
          <div className="cr-dead-msg">
            {parts.map((part, i) => {
              if (part.type === 'bold') {
                return <b key={i}>{part.text}</b>;
              }
              return <span key={i}>{part.text}</span>;
            })}
          </div>
        </div>
      </div>
      {suggestions && suggestions.length > 0 && (
        <FollowUps suggestions={suggestions} onSelect={onSelectSuggestion} />
      )}
    </>
  );
}

// ============================================
// COMPONENT: Tool Use Receipt (A.11)
// ============================================

interface ToolReceiptProps {
  sources: string[];
  listingsReviewed?: number;
  elapsedTime?: string;
}

export function ToolReceipt({ sources, listingsReviewed, elapsedTime }: ToolReceiptProps) {
  return (
    <div className="cr-tool-receipt">
      <span className="cr-tool-ic">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 7 L20 7 L20 13 M14 13 L20 7 M4 17 L4 19 L20 19 L20 17"/>
        </svg>
      </span>
      Searched {sources.map((s, i) => (
        <span key={i}><b>{s}</b>{i < sources.length - 1 && ', '}</span>
      ))}
      {listingsReviewed && <> · {listingsReviewed} listings reviewed</>}
      {elapsedTime && <> · {elapsedTime}</>}
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatSourceName(source: string): string {
  switch (source) {
    case 'ebay': return 'eBay';
    case 'etsy': return 'Etsy';
    case 'facebook': return 'FB';
    case 'craigslist': return 'CL';
    case '1stdibs': return '1stDibs';
    default: return source;
  }
}

interface TextPart {
  type: 'text' | 'bold' | 'italic';
  text: string;
}

function parseProseFormatting(content: string): TextPart[] {
  const parts: TextPart[] = [];
  // Match **bold** and *italic* patterns
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }

    const matched = match[0];
    if (matched.startsWith('**')) {
      // Bold
      parts.push({ type: 'bold', text: matched.slice(2, -2) });
    } else {
      // Italic
      parts.push({ type: 'italic', text: matched.slice(1, -1) });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', text: content }];
}

// ============================================
// PARSER: Parse structured model output
// ============================================

export interface ParsedResponse {
  thinking?: { verb: string; context?: string };
  searchStatus?: SearchStatus;
  prose: string[];
  cards: ListingCard[];
  callouts: CalloutBlock[];
  links: LinkPill[];
  comps: CompSale[];
  followUps: FollowUp[];
  toolReceipt?: { sources: string[]; listings?: number; time?: string };
  deadEnd?: { message: string };
  saveConfirm?: SaveConfirmation;
}

export function parseModelResponse(content: string): ParsedResponse {
  const result: ParsedResponse = {
    prose: [],
    cards: [],
    callouts: [],
    links: [],
    comps: [],
    followUps: []
  };

  // Split by fenced code blocks
  const blockRegex = /```(\w+(?::\w+)?)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = blockRegex.exec(content)) !== null) {
    // Get prose before this block
    const proseBeforeBlock = content.slice(lastIndex, match.index).trim();
    if (proseBeforeBlock) {
      // Split into paragraphs
      const paragraphs = proseBeforeBlock.split(/\n\n+/).filter(p => p.trim());
      result.prose.push(...paragraphs);
    }

    const blockType = match[1].toLowerCase();
    const blockContent = match[2].trim();

    try {
      if (blockType === 'card' || blockType === 'cards') {
        // Parse card JSON
        const cardData = JSON.parse(blockContent);
        const cards = Array.isArray(cardData) ? cardData : [cardData];
        for (const card of cards) {
          result.cards.push({
            id: card.id || Math.random().toString(36).substring(2, 9),
            source: card.source || 'ebay',
            title: card.title,
            price: card.price,
            score: card.score || 75,
            url: card.url,
            image: card.image,
            images: card.images || (card.image ? [card.image] : []),
            badges: card.badges || []
          });
        }
      } else if (blockType.startsWith('callout:')) {
        const calloutType = blockType.split(':')[1] as CalloutBlock['type'];
        result.callouts.push({ type: calloutType, content: blockContent });
      } else if (blockType === 'followups') {
        const followUpsData = JSON.parse(blockContent);
        for (const label of followUpsData) {
          result.followUps.push({ label, icon: inferFollowUpIcon(label) });
        }
      } else if (blockType === 'comps') {
        const compsData = JSON.parse(blockContent);
        result.comps = compsData;
      } else if (blockType === 'links') {
        const linksData = JSON.parse(blockContent);
        result.links = linksData;
      }
    } catch (e) {
      // If JSON parse fails, treat as prose
      result.prose.push(blockContent);
    }

    lastIndex = match.index + match[0].length;
  }

  // Get remaining prose after last block
  const remainingProse = content.slice(lastIndex).trim();
  if (remainingProse) {
    const paragraphs = remainingProse.split(/\n\n+/).filter(p => p.trim());
    result.prose.push(...paragraphs);
  }

  return result;
}

function inferFollowUpIcon(label: string): FollowUp['icon'] {
  const lower = label.toLowerCase();
  if (lower.includes('search') || lower.includes('find')) return 'search';
  if (lower.includes('comp') || lower.includes('sales') || lower.includes('price')) return 'comps';
  if (lower.includes('local') || lower.includes('pickup') || lower.includes('area')) return 'location';
  if (lower.includes('seller')) return 'seller';
  if (lower.includes('save')) return 'save';
  return 'search';
}

// ============================================
// EXPORTS
// ============================================

export {
  formatSourceName,
  parseProseFormatting
};
