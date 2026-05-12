import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DiamondIcon, IconSearch, IconArrowUp, IconSettings } from './ui/Icons';
import { ChatSettings } from './ChatSettings';
import { HuntSettingsPanel, OverrideChips, defaultHuntSettings, type HuntSettings } from './HuntSettingsPanel';
import {
  ThinkingState,
  SearchStatusBlock,
  ResultsHeader,
  ListingCardGrid,
  ProseBlock,
  Callout,
  LinkPills,
  CompsTable,
  FollowUps,
  DeadEnd,
  ToolReceipt,
  SaveConfirm,
  parseModelResponse,
  type ParsedResponse,
  type ListingCard,
  type SearchStatus,
  type FollowUp
} from './ChatResponseComponents';

interface ChatProps {
  projectId?: string;
  huntId?: string;
  onSearchingChange?: (isSearching: boolean) => void;
  onNeedHunt?: () => Promise<void>;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
  searchStatus?: SearchStatus;
  toolSources?: string[];
  toolListings?: number;
  toolTime?: string;
}


export function Chat({ projectId, huntId, onSearchingChange, onNeedHunt }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentHuntId, setCurrentHuntId] = useState<string | undefined>(huntId);
  const [showSettings, setShowSettings] = useState(false);
  const [showHuntSettings, setShowHuntSettings] = useState(false);
  const [huntLocation, setHuntLocation] = useState<{ zip_code?: string; search_radius?: number } | null>(null);
  const [huntSettings, setHuntSettings] = useState<HuntSettings>(defaultHuntSettings);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);

  // Load hunt settings
  useEffect(() => {
    if (currentHuntId) {
      fetch(`/api/hunts/${currentHuntId}`)
        .then(r => r.json())
        .then(hunt => {
          if (hunt.zip_code || hunt.search_radius) {
            setHuntLocation({ zip_code: hunt.zip_code, search_radius: hunt.search_radius });
          } else {
            setHuntLocation(null);
          }
        })
        .catch(() => setHuntLocation(null));
    } else {
      setHuntLocation(null);
    }
  }, [currentHuntId]);

  // Sync currentHuntId with prop
  useEffect(() => {
    if (huntId !== currentHuntId && !skipNextFetch.current) {
      setCurrentHuntId(huntId);
    }
    skipNextFetch.current = false;
  }, [huntId]);

  useEffect(() => {
    // Load messages from hunt or project
    if (currentHuntId) {
      fetch(`/api/hunts/${currentHuntId}/messages`)
        .then(r => r.json())
        .then(data => {
          // Only update if we got valid data
          if (Array.isArray(data)) {
            setMessages(data);
          }
        })
        .catch(console.error);
    } else if (projectId) {
      fetch(`/api/projects/${projectId}/chat`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMessages(data);
          }
        })
        .catch(console.error);
    }
    // Don't clear messages if no hunt/project - keep current state
  }, [projectId, currentHuntId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    onSearchingChange?.(true);

    try {
      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          huntId: currentHuntId,
          message: userMsg,
          searchSettings: {
            sources: huntSettings.sources,
            minPrice: huntSettings.priceMin,
            maxPrice: huntSettings.priceMax,
            zipCode: huntSettings.zipCode,
            location: huntSettings.location,
            radius: huntSettings.distance,
            listingAge: huntSettings.listingAge
          }
        })
      });

      // Check if a new hunt was auto-created
      const newHuntId = res.headers.get('X-Hunt-Id');
      if (newHuntId) {
        // Update local state to use the new hunt
        skipNextFetch.current = true;
        setCurrentHuntId(newHuntId);
        // Update URL without triggering re-render
        window.history.replaceState(null, '', `/chat/${newHuntId}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let aiText = '';
      setMessages(prev => [...prev, { role: 'ai', content: '', isStreaming: true }]);
      setIsLoading(false);

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setMessages(prev => {
              const newArr = [...prev];
              newArr[newArr.length - 1] = { ...newArr[newArr.length - 1], isStreaming: false };
              return newArr;
            });
            onSearchingChange?.(false);
            break;
          }
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            if (part.startsWith('data: ')) {
              try {
                const data = JSON.parse(part.slice(6));
                if (data.error) {
                  aiText += "\n\nError: " + data.error;
                } else if (data.text) {
                  aiText += data.text;
                }
                setMessages(prev => {
                  const newArr = [...prev];
                  newArr[newArr.length - 1] = { ...newArr[newArr.length - 1], content: aiText };
                  return newArr;
                });
              } catch (e) {}
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = { ...newArr[newArr.length - 1], content: "Error: " + (err as Error).message, isStreaming: false };
        return newArr;
      });
      setIsLoading(false);
      onSearchingChange?.(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        {messages.length === 0 && (
          <EmptyState />
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="animate-fade-in"
            >
              {msg.role === 'user' ? (
                <UserMessage content={msg.content} />
              ) : (
                <AssistantMessage
                  content={msg.content}
                  isStreaming={msg.isStreaming}
                  searchStatus={msg.searchStatus}
                  toolSources={msg.toolSources}
                  toolListings={msg.toolListings}
                  toolTime={msg.toolTime}
                  onFollowUp={(label) => {
                    setInput(label);
                  }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            className="msg-assistant"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="msg-assistant-mark active">
              <DiamondIcon size={12} />
            </div>
            <div className="msg-assistant-body">
              <ThinkingState verb="Reading the brief" context="searching marketplaces" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Composer */}
      <div
        className="p-3 md:p-4"
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-card)'
        }}
      >
        {/* Override chips row */}
        <OverrideChips
          settings={huntSettings}
          defaults={defaultHuntSettings}
          onRemoveOverride={(key) => {
            // Reset specific setting to default
            setHuntSettings(prev => ({
              ...prev,
              [key]: defaultHuntSettings[key as keyof HuntSettings]
            }));
          }}
          onResetAll={() => setHuntSettings(defaultHuntSettings)}
        />

        {/* Location badge row (legacy) */}
        {huntLocation?.zip_code && JSON.stringify(huntSettings) === JSON.stringify(defaultHuntSettings) && (
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              className="chat-location-badge"
              onClick={() => setShowHuntSettings(true)}
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2 C8 2 5 5 5 9 c0 5 7 13 7 13 s7-8 7-13 c0-4-3-7-7-7z"/>
                <circle cx="12" cy="9" r="2" fill="currentColor"/>
              </svg>
              {huntLocation.zip_code} · {huntLocation.search_radius || 50}mi
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Hunt settings toggle */}
          <button
            type="button"
            className={`chat-settings-toggle ${showHuntSettings ? 'active' : ''} ${JSON.stringify(huntSettings) !== JSON.stringify(defaultHuntSettings) ? 'has-overrides' : ''}`}
            onClick={() => setShowHuntSettings(!showHuntSettings)}
            title="Hunt settings"
          >
            <IconSettings size={15} />
          </button>

          <div
            className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: 'var(--color-bg-sub)',
              border: '0.5px solid var(--color-border-strong)'
            }}
          >
            <IconSearch size={14} style={{ color: 'var(--color-dim)' }} />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={huntLocation?.zip_code ? `Search near ${huntLocation.zip_code}...` : "Ask scout..."}
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{
                color: 'var(--color-text)',
                fontFamily: 'var(--font-body)'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors disabled:opacity-40"
              style={{
                background: 'var(--color-gold)',
                color: '#3a2a05'
              }}
            >
              <IconArrowUp size={13} />
            </button>
          </div>
        </form>
      </div>

      {/* Hunt Settings Panel */}
      <HuntSettingsPanel
        isOpen={showHuntSettings}
        onClose={() => setShowHuntSettings(false)}
        settings={huntSettings}
        onSettingsChange={(newSettings) => {
          setHuntSettings(newSettings);
          // Sync location with hunt settings
          setHuntLocation({
            zip_code: newSettings.zipCode,
            search_radius: newSettings.distance
          });
        }}
        projectName="Project"
      />

      {/* Legacy Settings modal */}
      {showSettings && currentHuntId && (
        <>
          <div className="chat-settings-backdrop" onClick={() => setShowSettings(false)} />
          <ChatSettings
            huntId={currentHuntId}
            onClose={() => setShowSettings(false)}
            onSave={() => {
              // Refresh location
              fetch(`/api/hunts/${currentHuntId}`)
                .then(r => r.json())
                .then(hunt => {
                  setHuntLocation({ zip_code: hunt.zip_code, search_radius: hunt.search_radius });
                });
            }}
          />
        </>
      )}
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="msg-user">
        {content}
      </div>
    </div>
  );
}

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
  searchStatus?: SearchStatus;
  toolSources?: string[];
  toolListings?: number;
  toolTime?: string;
  onFollowUp?: (label: string) => void;
}

function AssistantMessage({
  content,
  isStreaming,
  searchStatus,
  toolSources,
  toolListings,
  toolTime,
  onFollowUp
}: AssistantMessageProps) {
  // Parse structured response from content
  const parsed = isStreaming ? null : parseModelResponse(content);

  // Extract listings from legacy markdown format as fallback
  const legacyCards = !parsed?.cards.length && !isStreaming ? parseLegacyListings(content) : [];
  const cards = parsed?.cards.length ? parsed.cards : legacyCards;

  const handleSaveItem = (itemId: string) => {
    console.log('Save item:', itemId);
    // TODO: Call API to save item
  };

  const handleOpenListing = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Calculate price range and avg score for header
  const priceRange = cards.length > 0
    ? `$${Math.min(...cards.map(c => c.price))} – $${Math.max(...cards.map(c => c.price))}`
    : undefined;
  const avgScore = cards.length > 0
    ? Math.round(cards.reduce((sum, c) => sum + c.score, 0) / cards.length)
    : undefined;

  return (
    <div className="msg-assistant">
      <div className={`msg-assistant-mark ${isStreaming ? 'active' : ''}`}>
        <DiamondIcon size={12} />
      </div>
      <div className="msg-assistant-body">
        {/* Thinking state while streaming starts */}
        {isStreaming && !content && (
          <ThinkingState verb="Searching" context="finding the best options" />
        )}

        {/* Search status while actively searching */}
        {searchStatus && (
          <SearchStatusBlock status={searchStatus} />
        )}

        {/* Prose content */}
        {parsed?.prose.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: i * 0.08 }}
          >
            <ProseBlock content={p} />
          </motion.div>
        ))}

        {/* Fallback for legacy content without structured blocks */}
        {!parsed && content && (
          <div className="cr-prose">
            {content.split(/\n\n+/).map((para, i) => {
              // Skip paragraphs that look like listing headers
              if (para.match(/^###?\s*\[/)) return null;
              // Skip image markdown
              if (para.match(/^!\[/)) return null;
              // Skip price/source lines
              if (para.match(/^\*?\*?Price:/i)) return null;
              return <p key={i}>{para}</p>;
            })}
          </div>
        )}

        {/* Results header + Cards */}
        {cards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.16 }}
          >
            <ResultsHeader label="Top picks" priceRange={priceRange} avgScore={avgScore} />
            <ListingCardGrid
              items={cards}
              onSave={handleSaveItem}
              onOpen={handleOpenListing}
            />
          </motion.div>
        )}

        {/* Callouts */}
        {parsed?.callouts.map((callout, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.24 + i * 0.08 }}
          >
            <Callout type={callout.type} content={callout.content} />
          </motion.div>
        ))}

        {/* Link pills */}
        {parsed?.links && parsed.links.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.32 }}
          >
            <LinkPills links={parsed.links} />
          </motion.div>
        )}

        {/* Comps table */}
        {parsed?.comps && parsed.comps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.32 }}
          >
            <CompsTable sales={parsed.comps} />
          </motion.div>
        )}

        {/* Dead end state */}
        {parsed?.deadEnd && (
          <DeadEnd
            message={parsed.deadEnd.message}
            suggestions={parsed.followUps}
            onSelectSuggestion={onFollowUp}
          />
        )}

        {/* Follow-up suggestions */}
        {!parsed?.deadEnd && parsed?.followUps && parsed.followUps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.4 }}
          >
            <FollowUps suggestions={parsed.followUps} onSelect={onFollowUp} />
          </motion.div>
        )}

        {/* Tool receipt */}
        {!isStreaming && toolSources && toolSources.length > 0 && (
          <ToolReceipt
            sources={toolSources}
            listingsReviewed={toolListings}
            elapsedTime={toolTime}
          />
        )}
      </div>
    </div>
  );
}

// Validate that a URL is an actual listing page, not a search page
function isValidListingUrl(url: string): boolean {
  const urlLower = url.toLowerCase();

  // Reject URLs with search query params
  if (urlLower.includes('?') && (
    urlLower.includes('query=') ||
    urlLower.includes('search=') ||
    urlLower.includes('_nkw=') ||
    urlLower.includes('q=')
  )) {
    return false;
  }

  // Check for valid listing patterns
  if (urlLower.includes('ebay.com')) {
    return /ebay\.com\/itm\/\d{10,}/i.test(url) || /ebay\.com\/itm\/[^\/]+\/\d{10,}/i.test(url);
  }
  if (urlLower.includes('etsy.com')) {
    return /etsy\.com\/listing\/\d{5,}/i.test(url);
  }
  if (urlLower.includes('craigslist.org')) {
    return /craigslist\.org\/[a-z]{2,5}\/[a-z]{2,5}\/d\/[^\/]+\/\d{9,}\.html/i.test(url);
  }
  if (urlLower.includes('facebook.com')) {
    return /facebook\.com\/(marketplace\/)?item\/\d{10,}/i.test(url);
  }

  // For other sites, accept if it looks like a product page
  return /\/\d{6,}(\.html)?$/i.test(url) || /\/item\/\d+/i.test(url) || /\/product\/\d+/i.test(url);
}

// Validate image URL matches the listing source
function isValidImageForSource(imageUrl: string, listingSource: string): boolean {
  const imgLower = imageUrl.toLowerCase();

  // Known valid image CDN patterns by source
  const validPatterns: Record<string, RegExp[]> = {
    ebay: [/ebayimg\.com/i, /ebaystatic\.com/i],
    etsy: [/etsystatic\.com/i, /etsy\.com/i],
    craigslist: [/craigslist\.org/i, /images\.craigslist/i],
    facebook: [/fbcdn\.net/i, /facebook\.com/i, /fbsbx\.com/i, /scontent/i],
    mercari: [/mercari-images/i, /mercari\.com/i, /static\.mercdn/i],
    '1stdibs': [/1stdibs\.com/i, /a\.1stdibscdn/i, /shard\d+\.1stdibs/i],
    firstdibs: [/1stdibs\.com/i, /a\.1stdibscdn/i, /shard\d+\.1stdibs/i],
    chairish: [/chairish\.com/i, /chairish-prod/i],
    aptdeco: [/aptdeco\.com/i, /aptdeco-images/i],
    offerup: [/offerupnow\.com/i, /offerup\.com/i, /letgo/i],
  };

  const patterns = validPatterns[listingSource];
  if (!patterns) return true; // Accept for unknown sources - don't block images from new marketplaces

  return patterns.some(pattern => pattern.test(imgLower));
}

// Parse legacy markdown listings into cards (for backwards compatibility)
function parseLegacyListings(content: string): ListingCard[] {
  const cards: ListingCard[] = [];

  // Split content into listing blocks (separated by ### headers)
  const listingBlocks = content.split(/(?=###\s*\[)/);

  for (const block of listingBlocks) {
    // Match the title and URL: ### [Title](url)
    const linkMatch = block.match(/###?\s*\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/i);
    if (!linkMatch) continue;

    const title = linkMatch[1];
    const url = linkMatch[2];

    // VALIDATE: Only accept actual listing URLs
    if (!isValidListingUrl(url)) {
      console.log('[Chat] Rejected non-listing URL:', url);
      continue;
    }

    // Determine source from URL
    let source: ListingCard['source'] = 'ebay';
    if (url.includes('etsy')) source = 'etsy';
    else if (url.includes('craigslist')) source = 'craigslist';
    else if (url.includes('facebook')) source = 'facebook';
    else if (url.includes('mercari')) source = 'mercari';
    else if (url.includes('1stdibs')) source = '1stdibs';
    else if (url.includes('chairish')) source = 'chairish';
    else if (url.includes('aptdeco')) source = 'aptdeco';
    else if (url.includes('offerup')) source = 'offerup';

    // Extract image URLs - support multiple images for carousel
    let image: string | undefined;
    let images: string[] = [];

    // First try IMAGE_URLS: format (comma-separated, for multiple images)
    const imageUrlsMatch = block.match(/IMAGE_URLS:\s*([^\n]+)/i);
    if (imageUrlsMatch) {
      const urls = imageUrlsMatch[1].split(',').map(u => u.trim()).filter(u => u.startsWith('http'));
      images = urls.filter(u => isValidImageForSource(u, source));
      if (images.length > 0) {
        image = images[0]; // First image for backwards compat
      }
    }

    // If no IMAGE_URLS, try single image formats
    if (images.length === 0) {
      const imageMatch = block.match(/!\[[^\]]*\]\((https?:\/\/[^\)\s]+)\)/i);
      if (imageMatch) {
        const candidateImage = imageMatch[1];
        // Use image even if source doesn't match - better to show something
        if (!isValidImageForSource(candidateImage, source)) {
          console.log('[Chat] Warning: image source mismatch for', source, ':', candidateImage);
        }
        image = candidateImage;
        images = [candidateImage];
      } else {
        // Fallback: look for IMAGE_URL: format (single)
        const imageUrlMatch = block.match(/IMAGE_URL:\s*(https?:\/\/[^\s]+)/i);
        if (imageUrlMatch) {
          image = imageUrlMatch[1];
          images = [imageUrlMatch[1]];
        }
      }
    }

    // Extract EXACT price - multiple patterns for robustness
    let price = 0;
    // Try **Price:** $X format first
    const priceMatch1 = block.match(/\*?\*?Price:?\*?\*?\s*\$?([\d,]+(?:\.\d{2})?)/i);
    // Try | $X | format (table-like)
    const priceMatch2 = block.match(/\|\s*\$?([\d,]+(?:\.\d{2})?)\s*\|/);
    // Try standalone price like "$150" or "$1,200.00"
    const priceMatch3 = block.match(/\$\s*([\d,]+(?:\.\d{2})?)/);

    if (priceMatch1) {
      price = parseFloat(priceMatch1[1].replace(/,/g, ''));
    } else if (priceMatch2) {
      price = parseFloat(priceMatch2[1].replace(/,/g, ''));
    } else if (priceMatch3) {
      price = parseFloat(priceMatch3[1].replace(/,/g, ''));
    }

    // Generate score based on content heuristics
    let score = 75;
    const lowerBlock = block.toLowerCase();
    if (lowerBlock.includes('excellent') || lowerBlock.includes('mint') || lowerBlock.includes('perfect')) score += 15;
    if (lowerBlock.includes('vintage') || lowerBlock.includes('antique') || lowerBlock.includes('art deco')) score += 5;
    if (lowerBlock.includes('rare') || lowerBlock.includes('unique')) score += 5;
    if (lowerBlock.includes('free ship')) score += 3;
    score = Math.min(98, score);

    // Extract badges
    const badges: string[] = [];
    if (lowerBlock.includes('free ship')) badges.push('Free ship');
    if (lowerBlock.includes('local pickup')) badges.push('Local');
    const eraMatch = block.match(/\b(1\d{3}0s|19\d0s|20\d0s)\b/i);
    if (eraMatch) badges.push(eraMatch[1]);

    // Create stable ID from URL to prevent re-renders
    const stableId = url.split('/').pop()?.split('?')[0] || Math.random().toString(36).substring(2, 9);

    cards.push({
      id: stableId,
      source,
      title: title.substring(0, 60),
      price,
      score,
      url,
      image,
      images,
      badges
    });
  }

  return cards;
}

function EmptyState() {
  const suggestions = [
    "Find me art deco bar stools under $200",
    "Search for brass wall sconces",
    "Show me vintage decanters on eBay",
    "Look for velvet club chairs"
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{
          background: 'var(--color-gold-tint)',
          border: '0.5px solid var(--color-border-gold)'
        }}
      >
        <DiamondIcon size={24} className="text-[var(--color-gold)]" />
      </div>

      <h2
        className="text-lg font-medium mb-2"
        style={{ color: 'var(--color-cream)', fontFamily: 'var(--font-display)' }}
      >
        Start scouting
      </h2>
      <p
        className="text-sm mb-6 max-w-xs"
        style={{ color: 'var(--color-muted)' }}
      >
        Describe what you're looking for and I'll search marketplaces to find the perfect pieces.
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            className="px-3 py-1.5 rounded-full text-xs transition-colors"
            style={{
              background: 'var(--color-bg-sub)',
              border: '0.5px solid var(--color-border-strong)',
              color: 'var(--color-text-warm)',
              fontFamily: 'var(--font-display)'
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Chat;
