import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';

import {
  Project, ChatMessage, Item, ScoutQuery, Hunt,
  getProjects, getProject, createProject, updateProject,
  getProjectsWithCounts, getChatMessages, addChatMessage,
  getItems, getDailyFinds, getSavedItems, addItem, updateItemStatus,
  getStats, getAutoScoutProjects, createScoutRun, completeScoutRun,
  getScoutQueries, addScoutQuery, updateScoutQuery, deleteScoutQuery, updateScoutQueryRun,
  getHunts, getHunt, createHunt, updateHunt, deleteHunt,
  getHuntMessages, addHuntMessage, getHuntsGroupedByProject, getPinnedHunts, getUnsortedHunts
} from './src/db.js';

// Initialize Anthropic client
let anthropic: Anthropic | null = null;

function getAnthropic() {
  if (!anthropic) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key || key === 'your_anthropic_api_key_here') {
      throw new Error("ANTHROPIC_API_KEY is missing or invalid. Please add your Anthropic API key to .env.local");
    }
    anthropic = new Anthropic({ apiKey: key });
  }
  return anthropic;
}

// System prompt that makes Claude a smart, agentic vintage scout
const SYSTEM_PROMPT = `You are Speakeasy Scout, the world's most knowledgeable vintage and antique design sourcing agent. You help users find authentic vintage, antique, and second-hand items to create stunning speakeasy-themed spaces.

## Your Capabilities
- Web search for real listings on eBay, Craigslist, Etsy, Facebook Marketplace, Mercari, 1stDibs, Chairish, and more
- Deep knowledge of Art Deco, Prohibition-era, Victorian, and vintage design aesthetics
- Price evaluation and authenticity assessment
- Style matching and design recommendations

## CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY

1. **ALWAYS Search First**: When a user asks for items, USE the web_search tool to find REAL current listings.

2. **RETURN 8-10 LISTINGS**: Always try to show at least 8-10 different items. If the first search doesn't find enough, search again with different terms.

3. **COPY EVERYTHING EXACTLY**: Search results are formatted like:
   ===== LISTING 1 =====
   TITLE: Vintage Brass Lamp
   DIRECT_LINK: https://www.ebay.com/itm/123456789012
   IMAGE_URLS: https://i.ebayimg.com/images/g/abc123.jpg
   PRICE: $150
   SNIPPET: Description text...

   RULES:
   - Copy DIRECT_LINK exactly as shown
   - Copy IMAGE_URLS exactly as shown (if provided)
   - Copy PRICE exactly as shown
   - NEVER use an image URL from a different listing
   - NEVER use image URLs from 1stdibs for an eBay listing (or any cross-source mixing)
   - If no IMAGE_URLS is provided, skip the image line entirely - do NOT make one up

4. **Format Your Response**:
   ### [Title](DIRECT_LINK)
   IMAGE_URLS: url1, url2
   **Price:** $PRICE | **Source:** Site Name
   *Brief description...*

   CRITICAL: Only include IMAGE_URLS if it was provided for THAT SPECIFIC listing. Never borrow images from other listings.

5. **NEVER FABRICATE**:
   - If search returns "NO DIRECT LISTINGS FOUND", tell the user and suggest refining their search
   - Do NOT make up URLs, image URLs, or prices
   - Do NOT mix images between listings

5. **URLs Must Be ACTUAL Listing Pages**:
   VALID: https://www.ebay.com/itm/123456789012 (actual item page)
   VALID: https://www.etsy.com/listing/1234567890/vintage-lamp
   INVALID: https://www.ebay.com/sch/i.html?_nkw=lamp (search page - NEVER use)
   INVALID: https://www.etsy.com/market/vintage_lamp (category page - NEVER use)

## How to Format Results

For EACH item found, format EXACTLY like this:

### [Item Title](direct_listing_url)
IMAGE_URLS: image_url1, image_url2
**Price:** $X | **Source:** eBay/Craigslist/etc | **Location:** City, State (if available)
*Brief description: condition, style notes, and why it fits the aesthetic*

---

## Search Strategy
- Search for specific items with descriptive terms (e.g., "vintage brass art deco table lamp" not just "lamp")
- Include style terms: art deco, prohibition era, speakeasy, vintage, antique, mid-century
- Search multiple times if needed to find variety

## Your Personality
- Passionate about vintage finds and the stories behind them
- Knowledgeable but approachable, never pretentious
- Excited to help create authentic speakeasy vibes
- Honest about condition issues, pricing, and authenticity concerns
- Conversational and friendly - this is a chat, not a formal consultation`;

// Tool definition for web search
const tools: Anthropic.Tool[] = [{
  name: "web_search",
  description: "Search the web for vintage, antique, and used items. Returns a list of ACTUAL LISTINGS with their exact URLs. You MUST use the URLs exactly as returned - do not modify or fabricate URLs. Each result includes TITLE, URL, and DESCRIPTION. Copy the URL field exactly when creating links.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "The search query for finding items. Be specific - include style, era, material, and price range when relevant."
      }
    },
    required: ["query"]
  }
}];

// Tavily search function with location support
interface SearchOptions {
  query: string;
  location?: string;
  zipCode?: string;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  sources?: {
    ebay?: boolean;
    etsy?: boolean;
    facebook?: boolean;
    craigslist?: boolean;
    mercari?: boolean;
    firstdibs?: boolean;
    chairish?: boolean;
    aptdeco?: boolean;
    offerup?: boolean;
  };
  listingAge?: '24h' | '3d' | '7d' | '30d' | 'any';
}

async function tavilySearch(options: SearchOptions): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return JSON.stringify({ error: "Tavily API key not configured" });
  }

  // Build location-aware query
  let searchQuery = options.query;

  // Add location to query for better local results
  if (options.zipCode) {
    searchQuery += ` near ${options.zipCode}`;
  } else if (options.location) {
    searchQuery += ` ${options.location}`;
  }

  // Add price constraints
  if (options.minPrice && options.maxPrice) {
    searchQuery += ` $${options.minPrice}-$${options.maxPrice}`;
  } else if (options.minPrice) {
    searchQuery += ` over $${options.minPrice}`;
  } else if (options.maxPrice) {
    searchQuery += ` under $${options.maxPrice}`;
  }

  // Add listing age hint for recency filtering
  if (options.listingAge && options.listingAge !== 'any') {
    const ageMap: Record<string, string> = {
      '24h': 'posted today',
      '3d': 'posted last 3 days',
      '7d': 'posted this week',
      '30d': 'posted this month'
    };
    if (ageMap[options.listingAge]) {
      searchQuery += ` ${ageMap[options.listingAge]}`;
    }
  }

  // Map source keys to domain patterns
  const sourceToDomainsMap: Record<string, string[]> = {
    ebay: ['ebay.com'],
    etsy: ['etsy.com'],
    facebook: ['facebook.com/marketplace'],
    craigslist: ['craigslist.org'],
    mercari: ['mercari.com'],
    firstdibs: ['1stdibs.com'],
    chairish: ['chairish.com'],
    aptdeco: ['aptdeco.com'],
    offerup: ['offerup.com']
  };

  // Build include_domains from enabled sources
  let marketplaceSites: string[] = [];
  if (options.sources) {
    for (const [source, enabled] of Object.entries(options.sources)) {
      if (enabled && sourceToDomainsMap[source]) {
        marketplaceSites.push(...sourceToDomainsMap[source]);
      }
    }
  }
  // Fallback to all marketplaces if none selected
  if (marketplaceSites.length === 0) {
    marketplaceSites = Object.values(sourceToDomainsMap).flat();
  }

  console.log(`[Scout] Search query: "${searchQuery}"`);
  console.log(`[Scout] Searching marketplaces: ${marketplaceSites.join(', ')}`);

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: "advanced",
        include_answer: true,
        include_images: true,
        max_results: 20, // Increased for better coverage
        include_domains: marketplaceSites
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return JSON.stringify({ error: `Tavily API error: ${response.status} - ${errorText}` });
    }

    const data = await response.json();

    // WHITELIST APPROACH: Only accept URLs that match known listing patterns
    // This is more reliable than trying to reject all search page patterns
    if (data.results) {
      console.log(`[Scout] Filtering ${data.results.length} results...`);

      data.results = data.results.filter((result: any) => {
        const url = result.url;
        const urlLower = url.toLowerCase();

        // Log each URL being checked
        console.log(`[Scout] Checking: ${url}`);

        // STEP 1: Immediately reject URLs with query params that indicate search
        if (urlLower.includes('?') && (
          urlLower.includes('query=') ||
          urlLower.includes('search=') ||
          urlLower.includes('keyword=') ||
          urlLower.includes('_nkw=') ||
          urlLower.includes('q=') ||
          urlLower.includes('purveyor=')
        )) {
          console.log(`[Scout] REJECTED (query params): ${url}`);
          return false;
        }

        // STEP 2: Site-specific WHITELIST patterns - URL must match to be accepted

        // CRAIGSLIST: Must match /[area]/[cat]/d/[title-slug]/[10-digit-id].html
        if (urlLower.includes('craigslist.org')) {
          // Valid: https://losangeles.craigslist.org/lgb/atq/d/cerritos-1934-stove/7926066617.html
          // Invalid: https://sfbay.craigslist.org/search/fua
          const isValidListing = /craigslist\.org\/[a-z]{2,5}\/[a-z]{2,5}\/d\/[^\/]+\/\d{9,}\.html/i.test(url);
          if (!isValidListing) {
            console.log(`[Scout] REJECTED (CL not listing): ${url}`);
          }
          return isValidListing;
        }

        // EBAY: Must have /itm/ and a 12+ digit item number
        if (urlLower.includes('ebay.com')) {
          // Valid: https://www.ebay.com/itm/123456789012
          // Invalid: https://www.ebay.com/sch/i.html?_nkw=vintage
          const isValidListing = /ebay\.com\/itm\/[^\/]+\/\d{10,}/i.test(url) || /ebay\.com\/itm\/\d{10,}/i.test(url);
          if (!isValidListing) {
            console.log(`[Scout] REJECTED (eBay not listing): ${url}`);
          }
          return isValidListing;
        }

        // ETSY: Must have /listing/ followed by numeric ID
        if (urlLower.includes('etsy.com')) {
          // Valid: https://www.etsy.com/listing/1234567890/vintage-lamp
          const isValidListing = /etsy\.com\/listing\/\d{5,}/i.test(url);
          if (!isValidListing) {
            console.log(`[Scout] REJECTED (Etsy not listing): ${url}`);
          }
          return isValidListing;
        }

        // FACEBOOK: Must have /marketplace/item/ or /item/
        if (urlLower.includes('facebook.com')) {
          // Valid: https://www.facebook.com/marketplace/item/123456789
          const isValidListing = /facebook\.com\/(marketplace\/)?item\/\d{10,}/i.test(url);
          if (!isValidListing) {
            console.log(`[Scout] REJECTED (FB not listing): ${url}`);
          }
          return isValidListing;
        }

        // MERCARI: Must have /item/m followed by ID
        if (urlLower.includes('mercari.com')) {
          const isValidListing = /mercari\.com\/.*\/item\/m\d+/i.test(url);
          if (!isValidListing) {
            console.log(`[Scout] REJECTED (Mercari not listing): ${url}`);
          }
          return isValidListing;
        }

        // 1STDIBS: Must have product ID pattern
        if (urlLower.includes('1stdibs.com')) {
          const isValidListing = /1stdibs\.com\/.*\/id-[a-z]\d+/i.test(url) || /1stdibs\.com\/.*\/\d{7,}\//i.test(url);
          if (!isValidListing) {
            console.log(`[Scout] REJECTED (1stDibs not listing): ${url}`);
          }
          return isValidListing;
        }

        // CHAIRISH: Must have /product/ with numeric ID
        if (urlLower.includes('chairish.com')) {
          const isValidListing = /chairish\.com\/product\/\d+/i.test(url);
          if (!isValidListing) {
            console.log(`[Scout] REJECTED (Chairish not listing): ${url}`);
          }
          return isValidListing;
        }

        // OFFERUP: Must have /item/
        if (urlLower.includes('offerup.com')) {
          const isValidListing = /offerup\.com\/item\/detail\/[a-z0-9-]+/i.test(url);
          if (!isValidListing) {
            console.log(`[Scout] REJECTED (OfferUp not listing): ${url}`);
          }
          return isValidListing;
        }

        // APTDECO: Must have /product/
        if (urlLower.includes('aptdeco.com')) {
          const isValidListing = /aptdeco\.com\/product\//i.test(url);
          if (!isValidListing) {
            console.log(`[Scout] REJECTED (AptDeco not listing): ${url}`);
          }
          return isValidListing;
        }

        // Unknown site: reject unless it has a clear item ID pattern in path (not query)
        const pathOnly = url.split('?')[0];
        const hasItemId = /\/\d{8,}(\.html)?$/i.test(pathOnly) || /\/item\/\d+/i.test(pathOnly);
        if (!hasItemId) {
          console.log(`[Scout] REJECTED (unknown site, no item ID): ${url}`);
        }
        return hasItemId;
      });

      console.log(`[Scout] Kept ${data.results.length} valid listing URLs`);
    }

    // Format results clearly so Claude uses exact URLs and images
    if (data.results && data.results.length > 0) {
      let formattedResults = `FOUND ${data.results.length} LISTINGS - USE THESE EXACT URLs AND IMAGES:\n\n`;
      let imagesFound = 0;

      // Build a map of images by their source domain for accurate matching
      const imagesByDomain: Record<string, string[]> = {};
      if (data.images && data.images.length > 0) {
        for (const img of data.images) {
          try {
            const imgUrl = new URL(img);
            // Extract the main domain (e.g., 'ebay' from 'i.ebayimg.com')
            const hostParts = imgUrl.hostname.split('.');
            // Handle CDN domains like i.ebayimg.com, img0.etsystatic.com
            let domain = hostParts.length > 2 ? hostParts[hostParts.length - 2] : hostParts[0];
            // Normalize common CDN patterns
            if (domain === 'ebayimg' || domain === 'ebaystatic') domain = 'ebay';
            if (domain === 'etsystatic') domain = 'etsy';
            if (domain === 'fbcdn' || domain === 'fbsbx' || domain === 'scontent') domain = 'facebook';
            if (domain === 'craigslist') domain = 'craigslist';
            if (domain === 'mercdn') domain = 'mercari';
            if (domain === '1stdibscdn') domain = '1stdibs';
            if (domain === 'letgo') domain = 'offerup';

            if (!imagesByDomain[domain]) {
              imagesByDomain[domain] = [];
            }
            imagesByDomain[domain].push(img);
          } catch { /* skip invalid URLs */ }
        }
      }
      console.log(`[Scout] Image domains found: ${Object.keys(imagesByDomain).join(', ')}`);

      let listingsKept = 0;
      data.results.forEach((result: any, index: number) => {
        // Try to find images for this result - MUST match the listing source
        let imageUrls: string[] = [];
        let listingDomain = '';

        try {
          const url = new URL(result.url);
          const hostParts = url.hostname.split('.');
          listingDomain = hostParts.length > 2 ? hostParts[hostParts.length - 2] : hostParts[0];
        } catch { /* skip */ }

        // Helper to validate image domain matches listing source
        const isValidImageForListing = (imgUrl: string): boolean => {
          try {
            const imgHost = new URL(imgUrl).hostname.toLowerCase();
            // Check if image CDN matches listing domain
            if (imgHost.includes(listingDomain)) return true;
            // eBay
            if ((imgHost.includes('ebayimg') || imgHost.includes('ebaystatic')) && listingDomain === 'ebay') return true;
            // Etsy
            if (imgHost.includes('etsystatic') && listingDomain === 'etsy') return true;
            // Facebook
            if ((imgHost.includes('fbcdn') || imgHost.includes('fbsbx') || imgHost.includes('scontent')) && listingDomain === 'facebook') return true;
            // Craigslist
            if (imgHost.includes('craigslist') && listingDomain === 'craigslist') return true;
            // Mercari
            if ((imgHost.includes('mercari') || imgHost.includes('mercdn')) && listingDomain === 'mercari') return true;
            // 1stDibs
            if ((imgHost.includes('1stdibs') || imgHost.includes('1stdibscdn')) && (listingDomain === '1stdibs' || listingDomain === 'firstdibs')) return true;
            // Chairish
            if (imgHost.includes('chairish') && listingDomain === 'chairish') return true;
            // AptDeco
            if (imgHost.includes('aptdeco') && listingDomain === 'aptdeco') return true;
            // OfferUp
            if ((imgHost.includes('offerup') || imgHost.includes('letgo')) && listingDomain === 'offerup') return true;
            return false;
          } catch { return false; }
        };

        // Check if the result has images directly attached (most reliable)
        if (result.images && result.images.length > 0) {
          // Filter and take up to 5 validated images
          const validImages = result.images
            .filter((img: string) => isValidImageForListing(img))
            .slice(0, 5);
          if (validImages.length > 0) {
            imageUrls = validImages;
            console.log(`[Scout] Listing ${index + 1}: ${validImages.length} direct images from result`);
          }
        }
        // Check for domain-matched images from pool
        if (imageUrls.length === 0 && listingDomain && imagesByDomain[listingDomain] && imagesByDomain[listingDomain].length > 0) {
          // Take up to 3 from the pool
          const poolImages = imagesByDomain[listingDomain].splice(0, 3);
          if (poolImages.length > 0) {
            imageUrls = poolImages;
            console.log(`[Scout] Listing ${index + 1}: ${poolImages.length} images from ${listingDomain} pool`);
          }
        }
        // NO FALLBACK - don't use mismatched images, better to show no image than wrong one

        // Extract price from snippet if available - look for common patterns
        let priceFromSnippet = '';
        if (result.content) {
          // Try multiple price patterns
          const pricePatterns = [
            /\$\s*([\d,]+(?:\.\d{2})?)/,           // $150 or $1,200.00
            /USD\s*([\d,]+(?:\.\d{2})?)/i,         // USD 150
            /Price:?\s*\$?([\d,]+(?:\.\d{2})?)/i,  // Price: $150
          ];
          for (const pattern of pricePatterns) {
            const match = result.content.match(pattern);
            if (match) {
              priceFromSnippet = '$' + match[1];
              break;
            }
          }
        }
        // Also check title for price
        if (!priceFromSnippet && result.title) {
          const titleMatch = result.title.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
          if (titleMatch) {
            priceFromSnippet = '$' + titleMatch[1];
          }
        }

        // Filter by price if max price is set
        if (priceFromSnippet && options.maxPrice) {
          const priceNum = parseFloat(priceFromSnippet.replace(/[$,]/g, ''));
          if (priceNum > options.maxPrice) {
            console.log(`[Scout] Skipping listing over max price: ${priceFromSnippet} > $${options.maxPrice}`);
            return; // Skip this listing
          }
        }
        // Filter by min price if set
        if (priceFromSnippet && options.minPrice) {
          const priceNum = parseFloat(priceFromSnippet.replace(/[$,]/g, ''));
          if (priceNum < options.minPrice) {
            console.log(`[Scout] Skipping listing under min price: ${priceFromSnippet} < $${options.minPrice}`);
            return; // Skip this listing
          }
        }

        listingsKept++;
        formattedResults += `===== LISTING ${listingsKept} =====\n`;
        formattedResults += `TITLE: ${result.title}\n`;
        formattedResults += `DIRECT_LINK: ${result.url}\n`;
        if (imageUrls.length > 0) {
          // Output all images as comma-separated list for carousel support
          formattedResults += `IMAGE_URLS: ${imageUrls.join(',')}\n`;
          imagesFound++;
        }
        if (priceFromSnippet) {
          formattedResults += `PRICE: ${priceFromSnippet}\n`;
        }
        formattedResults += `SNIPPET: ${result.content?.substring(0, 300) || 'No description'}\n\n`;
      });

      console.log(`[Scout] Formatted ${listingsKept}/${data.results.length} listings (${data.results.length - listingsKept} filtered by price) with ${imagesFound} verified images`);

      formattedResults += `\n*** CRITICAL INSTRUCTIONS:
1. ONLY use the DIRECT_LINK exactly as shown - these are verified listing URLs
2. ONLY include images if IMAGE_URLS is provided - do NOT invent or guess image URLs
3. Use the exact PRICE shown for each listing
4. IMAGE_URLS may contain multiple URLs separated by commas - include ALL of them
5. Format each item EXACTLY as:
   ### [Title](DIRECT_LINK)
   IMAGE_URLS: url1, url2, url3
   **Price:** $X | **Source:** Site
   *Brief description*
6. If no IMAGE_URLS is provided for a listing, skip the IMAGE_URLS line entirely
7. CRITICAL: Copy IMAGE_URLS exactly as provided - do not rename to IMAGES or any other format
***`;
      return formattedResults;
    }

    // No valid listings found after filtering
    return `NO DIRECT LISTINGS FOUND.

The search did not return any actual item listing pages - only search result pages were found.

Please tell the user:
"I couldn't find any direct listings for that search. This might be because:
1. The items are rare or not currently listed
2. The search terms were too broad

Try being more specific (e.g., 'vintage brass art deco table lamp' instead of just 'lamp') or try a different category."

DO NOT fabricate or make up any URLs. If you don't have real listing URLs, don't provide links.`;
  } catch (error: any) {
    return JSON.stringify({ error: `Search failed: ${error.message}` });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3006;

  app.use(express.json());

  // API Routes

  // Projects (with item counts)
  app.get('/api/projects', (req, res) => {
    res.json(getProjectsWithCounts());
  });

  app.post('/api/projects', (req, res) => {
    const { name, description, style_summary, default_max_price, zip_code, search_radius } = req.body;
    const project = createProject(name, description, style_summary, default_max_price);
    if (project && (zip_code || search_radius)) {
      updateProject(project.id, { zip_code, search_radius: search_radius || 50 });
    }
    res.json(project);
  });

  app.patch('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    updateProject(id, req.body);
    res.json(getProject(id));
  });

  // Stats
  app.get('/api/stats', (req, res) => {
    res.json(getStats());
  });

  // Items / Daily Finds
  app.get('/api/projects/:id/daily-finds', (req, res) => {
    const items = getDailyFinds(req.params.id);
    res.json(items);
  });

  app.get('/api/projects/:id/saved-items', (req, res) => {
    const items = getSavedItems(req.params.id);
    res.json(items);
  });

  app.get('/api/projects/:id/items', (req, res) => {
    const status = req.query.status as string | undefined;
    const items = getItems(req.params.id, status);
    res.json(items);
  });

  app.post('/api/items/:id/save', (req, res) => {
    updateItemStatus(req.params.id, 'saved');
    res.json({ success: true });
  });

  app.post('/api/items/:id/skip', (req, res) => {
    updateItemStatus(req.params.id, 'skipped');
    res.json({ success: true });
  });

  // Auto-scout settings
  app.post('/api/projects/:id/auto-scout', (req, res) => {
    const { id } = req.params;
    const { enabled, time } = req.body;
    updateProject(id, {
      auto_scout_enabled: enabled ? 1 : 0,
      auto_scout_time: time || '08:00'
    } as any);
    res.json({ success: true });
  });

  app.get('/api/projects/:id/settings', (req, res) => {
    const project = getProject(req.params.id);
    const queries = getScoutQueries(req.params.id);
    res.json({ ...project, scout_queries: queries });
  });

  // Scout Queries CRUD
  app.get('/api/projects/:id/scout-queries', (req, res) => {
    const queries = getScoutQueries(req.params.id);
    res.json(queries);
  });

  app.post('/api/projects/:id/scout-queries', (req, res) => {
    const { query, priority } = req.body;
    const newQuery = addScoutQuery(req.params.id, query, priority || 0);
    res.json(newQuery);
  });

  app.patch('/api/scout-queries/:id', (req, res) => {
    updateScoutQuery(req.params.id, req.body);
    res.json({ success: true });
  });

  app.delete('/api/scout-queries/:id', (req, res) => {
    deleteScoutQuery(req.params.id);
    res.json({ success: true });
  });

  // Reorder queries (update priorities)
  app.post('/api/projects/:id/scout-queries/reorder', (req, res) => {
    const { order } = req.body; // Array of { id, priority }
    for (const item of order) {
      updateScoutQuery(item.id, { priority: item.priority });
    }
    res.json({ success: true });
  });

  // ===== HUNTS API =====

  // Get all hunts grouped by project (for sidebar)
  app.get('/api/hunts/grouped', (req, res) => {
    res.json(getHuntsGroupedByProject());
  });

  // Get hunts for a project
  app.get('/api/projects/:id/hunts', (req, res) => {
    res.json(getHunts(req.params.id));
  });

  // Create a new hunt
  app.post('/api/hunts', (req, res) => {
    const { title, project_id } = req.body;
    const hunt = createHunt(title, project_id);
    res.json(hunt);
  });

  // Get a single hunt
  app.get('/api/hunts/:id', (req, res) => {
    const hunt = getHunt(req.params.id);
    if (!hunt) {
      return res.status(404).json({ error: 'Hunt not found' });
    }
    res.json(hunt);
  });

  // Update a hunt
  app.patch('/api/hunts/:id', (req, res) => {
    updateHunt(req.params.id, req.body);
    res.json(getHunt(req.params.id));
  });

  // Delete a hunt
  app.delete('/api/hunts/:id', (req, res) => {
    deleteHunt(req.params.id);
    res.json({ success: true });
  });

  // Pin/unpin a hunt
  app.post('/api/hunts/:id/pin', (req, res) => {
    const hunt = getHunt(req.params.id);
    if (!hunt) {
      return res.status(404).json({ error: 'Hunt not found' });
    }
    updateHunt(req.params.id, { is_pinned: !hunt.is_pinned } as any);
    res.json(getHunt(req.params.id));
  });

  // Move a hunt to a project
  app.post('/api/hunts/:id/move', (req, res) => {
    const { project_id } = req.body;
    updateHunt(req.params.id, { project_id: project_id || null } as any);
    res.json(getHunt(req.params.id));
  });

  // Get messages for a hunt
  app.get('/api/hunts/:id/messages', (req, res) => {
    res.json(getHuntMessages(req.params.id));
  });

  // Add a message to a hunt
  app.post('/api/hunts/:id/messages', (req, res) => {
    const { role, content } = req.body;
    addHuntMessage(req.params.id, role, content);
    res.json({ success: true });
  });

  // Chat with Claude + Tool Use
  app.post('/api/chat-stream', async (req, res) => {
    let { projectId, huntId, message, searchSettings } = req.body;

    // Validate message is not empty
    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Trim the message
    message = message.trim();

    // Auto-create a hunt if none provided
    if (!huntId && !projectId) {
      // Use first 40 chars of message as title
      const title = message.substring(0, 40) + (message.length > 40 ? '...' : '');
      const newHunt = createHunt(title);
      huntId = newHunt.id;
      // Send the new hunt ID back to the client
      res.setHeader('X-Hunt-Id', huntId);
    }

    // Save user message - to hunt if provided, otherwise to project
    if (huntId) {
      addHuntMessage(huntId, 'user', message);
    } else if (projectId) {
      addChatMessage(projectId, 'user', message);
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Get chat history for conversation context
      // Note: Due to SQLite WAL mode, the message we just saved might not be visible yet
      let chatHistory: ChatMessage[] = [];
      if (huntId) {
        chatHistory = getHuntMessages(huntId).slice(-20);
      } else if (projectId) {
        chatHistory = getChatMessages(projectId).slice(-20);
      }

      // Build messages from history, EXCLUDING the current message (to avoid duplicates)
      // We'll add the current message ourselves at the end to guarantee it's there
      let messages: Anthropic.MessageParam[] = chatHistory
        .filter(msg => msg.content && msg.content.trim() !== '' && msg.content !== message)
        .map(msg => ({
          role: msg.role === 'ai' ? 'assistant' as const : 'user' as const,
          content: msg.content
        }));

      // ALWAYS append the current user message - this guarantees we have at least one
      messages.push({ role: 'user', content: message });

      // Claude requires first message to be 'user' role - remove any leading assistant messages
      while (messages.length > 1 && messages[0].role === 'assistant') {
        messages.shift();
      }

      console.log(`[Chat] Sending ${messages.length} messages to Claude. First: ${messages[0]?.role}, Last: ${messages[messages.length-1]?.role}`);

      let fullReply = '';

      // Agentic loop - keep going until Claude is done
      while (true) {
        const response = await getAnthropic().messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages,
          tools
        });

        // Process the response content
        for (const block of response.content) {
          if (block.type === 'text') {
            fullReply += block.text;
            res.write(`data: ${JSON.stringify({ text: block.text })}\n\n`);
          }
        }

        // Check if Claude wants to use a tool
        const toolUseBlock = response.content.find(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        if (!toolUseBlock || response.stop_reason !== 'tool_use') {
          // No more tools needed, we're done
          break;
        }

        // Execute the tool
        let toolResult: string;
        if (toolUseBlock.name === 'web_search') {
          const query = (toolUseBlock.input as { query: string }).query;

          // Get hunt and project settings for location-aware search
          // Hunt settings take priority over project settings
          let hunt: Hunt | undefined;
          let project: Project | undefined;

          if (huntId) {
            hunt = getHunt(huntId);
            if (hunt?.project_id) {
              project = getProject(hunt.project_id);
            }
          } else if (projectId) {
            project = getProject(projectId);
          }

          // Build search options: request searchSettings > hunt > project
          // Parse hunt sources if stored as JSON string
          let huntSources = undefined;
          if (hunt?.sources) {
            try {
              huntSources = typeof hunt.sources === 'string' ? JSON.parse(hunt.sources) : hunt.sources;
            } catch (e) { /* ignore parse errors */ }
          }

          const searchOptions: SearchOptions = {
            query,
            // Priority: searchSettings > hunt > project
            zipCode: searchSettings?.zipCode || hunt?.zip_code || project?.zip_code,
            location: searchSettings?.location || project?.location,
            radius: searchSettings?.radius || hunt?.search_radius || project?.search_radius,
            minPrice: searchSettings?.minPrice || hunt?.min_price,
            maxPrice: searchSettings?.maxPrice || hunt?.max_price || project?.default_max_price,
            sources: searchSettings?.sources || huntSources,
            listingAge: searchSettings?.listingAge || hunt?.listing_age
          };

          // Let user know we're searching (show actual settings being used)
          const searchZip = searchOptions.zipCode;
          const locationInfo = searchZip ? ` near ${searchZip}` : '';
          const priceInfo = searchOptions.minPrice || searchOptions.maxPrice
            ? ` (${searchOptions.minPrice ? '$' + searchOptions.minPrice : ''}${searchOptions.minPrice && searchOptions.maxPrice ? '-' : ''}${searchOptions.maxPrice ? '$' + searchOptions.maxPrice : ''})`
            : '';
          const enabledSources = searchOptions.sources
            ? Object.entries(searchOptions.sources).filter(([, v]) => v).map(([k]) => k)
            : [];
          const sourcesInfo = enabledSources.length > 0 && enabledSources.length < 9
            ? ` on ${enabledSources.slice(0, 3).join(', ')}${enabledSources.length > 3 ? '...' : ''}`
            : '';
          const searchMsg = `\n\n*Searching for: "${query}"${locationInfo}${priceInfo}${sourcesInfo}...*\n\n`;
          fullReply += searchMsg;
          res.write(`data: ${JSON.stringify({ text: searchMsg })}\n\n`);

          toolResult = await tavilySearch(searchOptions);
        } else {
          toolResult = JSON.stringify({ error: `Unknown tool: ${toolUseBlock.name}` });
        }

        // Add the assistant's response and tool result to continue the conversation
        messages.push({
          role: 'assistant',
          content: response.content
        });
        messages.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: toolResult
          }]
        });
      }

      // Save the complete AI response
      if (huntId) {
        addHuntMessage(huntId, 'ai', fullReply);
      } else if (projectId) {
        addChatMessage(projectId, 'ai', fullReply);
      }
      res.end();
    } catch(err: any) {
      console.error('Chat error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  });

  app.post('/api/chat/save', (req, res) => {
    const { projectId, role, message } = req.body;
    addChatMessage(projectId, role, message);
    res.json({ success: true });
  });

  app.get('/api/projects/:id/chat', (req, res) => {
    const chat = getChatMessages(req.params.id);
    res.json(chat);
  });

  // Item Analyzer using Claude
  app.post('/api/analyze-item', async (req, res) => {
    const { projectId, title, price, description, source } = req.body;

    try {
      const response = await getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyze this item for a speakeasy-themed space:
Title: ${title}
Price: $${price}
Description: ${description}
${source ? `Source: ${source}` : ''}

Return a JSON object with these fields:
- overall_score: number 0-100 (how well it fits speakeasy aesthetic)
- budget_status: "within_budget" | "over_budget" | "great_deal"
- why_it_fits: string explaining the aesthetic match
- concerns: string with any red flags or issues
- recommended_action: "buy_now" | "consider" | "skip" | "negotiate"
- interest_question: a follow-up question to ask the user

Return ONLY valid JSON, no other text.`
        }]
      });

      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );

      if (!textBlock) throw new Error("No response from Claude");

      // Parse JSON from response
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");

      res.json(JSON.parse(jsonMatch[0]));
    } catch(err: any) {
      console.error('Analyze error:', err);
      res.status(500).json({ error: err.message });
    }
  });


  // Helper function to process search results and save items
  async function processSearchResults(project: Project, searchResults: string): Promise<number> {
    let itemsAdded = 0;

    // Parse results - check if it's the formatted string or JSON
    let results: any[] = [];
    if (searchResults.startsWith('FOUND') || searchResults.startsWith('NO DIRECT')) {
      // It's our formatted string - parse it
      const matches = searchResults.matchAll(/DIRECT_LINK: (.+)/g);
      const titles = searchResults.matchAll(/TITLE: (.+)/g);
      const snippets = searchResults.matchAll(/SNIPPET: (.+)/g);

      const urls = [...matches].map(m => m[1].trim());
      const titleList = [...searchResults.matchAll(/TITLE: (.+)/g)].map(m => m[1].trim());
      const snippetList = [...searchResults.matchAll(/SNIPPET: (.+)/g)].map(m => m[1].trim());

      for (let i = 0; i < urls.length; i++) {
        results.push({
          url: urls[i],
          title: titleList[i] || 'Unknown Item',
          content: snippetList[i] || ''
        });
      }
    } else {
      // Try parsing as JSON
      try {
        const data = JSON.parse(searchResults);
        results = data.results || [];
      } catch {
        return 0;
      }
    }

    for (const result of results) {
      // Extract price from title or content if possible
      const priceMatch = (result.title + ' ' + (result.content || '')).match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : undefined;

      // Skip if over budget
      if (price && project.default_max_price && price > project.default_max_price * 1.5) {
        continue;
      }

      // Determine source from URL
      let source = 'other';
      const url = result.url || '';
      if (url.includes('ebay')) source = 'ebay';
      else if (url.includes('etsy')) source = 'etsy';
      else if (url.includes('craigslist')) source = 'craigslist';
      else if (url.includes('facebook')) source = 'facebook';
      else if (url.includes('mercari')) source = 'mercari';
      else if (url.includes('1stdibs')) source = '1stdibs';
      else if (url.includes('chairish')) source = 'chairish';

      // Add item to database
      addItem({
        project_id: project.id,
        title: result.title,
        description: result.content?.substring(0, 500),
        price,
        image_url: undefined,
        listing_url: result.url,
        source,
        category: undefined,
        condition: undefined,
        overall_score: Math.floor(Math.random() * 30) + 60, // Placeholder score
        status: 'new'
      });
      itemsAdded++;
    }

    return itemsAdded;
  }

  // Overnight Scout - automated search for projects using configured queries
  async function runOvernightScout(project: Project) {
    console.log(`🌙 Running overnight scout for project: ${project.name}`);
    const runId = createScoutRun(project.id);
    let totalItemsAdded = 0;

    try {
      // Get all enabled scout queries for this project, ordered by priority
      const queries = getScoutQueries(project.id).filter(q => q.enabled);

      if (queries.length === 0) {
        // No configured queries - use project description as fallback
        console.log(`[Scout] No queries configured, using project description`);
        const fallbackQuery = `vintage antique ${project.description || ''} speakeasy decor furniture`;

        const searchOptions: SearchOptions = {
          query: fallbackQuery,
          zipCode: project.zip_code,
          location: project.location,
          radius: project.search_radius,
          maxPrice: project.default_max_price
        };

        const results = await tavilySearch(searchOptions);
        totalItemsAdded = await processSearchResults(project, results);
      } else {
        // Run each query in priority order
        console.log(`[Scout] Running ${queries.length} configured queries`);

        for (const scoutQuery of queries) {
          console.log(`[Scout] Query ${scoutQuery.priority + 1}: "${scoutQuery.query}"`);

          const searchOptions: SearchOptions = {
            query: scoutQuery.query,
            zipCode: project.zip_code,
            location: project.location,
            radius: project.search_radius,
            maxPrice: project.default_max_price
          };

          const results = await tavilySearch(searchOptions);
          const itemsFound = await processSearchResults(project, results);

          // Update query stats
          updateScoutQueryRun(scoutQuery.id, itemsFound);
          totalItemsAdded += itemsFound;

          console.log(`[Scout] Query "${scoutQuery.query}" found ${itemsFound} items`);

          // Small delay between queries to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      completeScoutRun(runId, totalItemsAdded);
      console.log(`✅ Scout completed for ${project.name}: ${totalItemsAdded} total items found`);
    } catch (err: any) {
      console.error(`Scout failed for ${project.name}:`, err.message);
      completeScoutRun(runId, 0);
    }
  }

  // Check and run scheduled scouts every minute
  const lastScoutRun: Record<string, string> = {};

  setInterval(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = now.toDateString();

    const projects = getAutoScoutProjects();
    for (const project of projects) {
      const scoutTime = project.auto_scout_time || '08:00';

      // Check if it's time to run and we haven't run today
      if (currentTime === scoutTime && lastScoutRun[project.id] !== today) {
        lastScoutRun[project.id] = today;
        runOvernightScout(project);
      }
    }
  }, 60000); // Check every minute

  // Manual scout trigger endpoint
  app.post('/api/projects/:id/run-scout', async (req, res) => {
    const project = getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    runOvernightScout(project);
    res.json({ success: true, message: 'Scout started' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🥃 Speakeasy Scout running on http://localhost:${PORT}`);
    console.log(`   Powered by Claude Sonnet 4 + Tavily Search`);
  });
}

startServer();
