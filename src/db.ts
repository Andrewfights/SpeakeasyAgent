import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'speakeasy.sqlite'));

// Create Tables
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    style_summary TEXT,
    location TEXT,
    zip_code TEXT,
    search_radius INTEGER DEFAULT 50,
    auto_scout_enabled INTEGER DEFAULT 0,
    auto_scout_time TEXT DEFAULT '08:00',
    default_max_price REAL DEFAULT 200,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS preferences (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    likes TEXT DEFAULT '[]',
    dislikes TEXT DEFAULT '[]',
    colors TEXT DEFAULT '[]',
    materials TEXT DEFAULT '[]',
    avoid TEXT DEFAULT '[]',
    style_tags TEXT DEFAULT '[]',
    priority_categories TEXT DEFAULT '[]',
    design_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price REAL,
    image_url TEXT,
    listing_url TEXT,
    source TEXT,
    location TEXT,
    category TEXT,
    condition TEXT,
    budget_status TEXT,
    overall_score INTEGER,
    style_score INTEGER,
    price_score INTEGER,
    vintage_score INTEGER,
    condition_score INTEGER,
    usefulness_score INTEGER,
    uniqueness_score INTEGER,
    why_it_fits TEXT,
    concerns TEXT,
    best_use TEXT,
    recommended_action TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scout_runs (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    items_found INTEGER DEFAULT 0,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scout_queries (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    last_run DATETIME,
    items_found INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS hunts (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_pinned INTEGER DEFAULT 0,
    saved_count INTEGER DEFAULT 0,
    items_returned INTEGER DEFAULT 0,
    best_price REAL,
    zip_code TEXT,
    search_radius INTEGER DEFAULT 50,
    max_price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add columns if they don't exist (for existing databases)
try {
  db.exec(`ALTER TABLE projects ADD COLUMN zip_code TEXT`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE projects ADD COLUMN search_radius INTEGER DEFAULT 50`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE projects ADD COLUMN auto_scout_enabled INTEGER DEFAULT 0`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE projects ADD COLUMN auto_scout_time TEXT DEFAULT '08:00'`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE projects ADD COLUMN color TEXT DEFAULT '#7f1d1d'`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE chat_messages ADD COLUMN hunt_id TEXT`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE hunts ADD COLUMN zip_code TEXT`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE hunts ADD COLUMN search_radius INTEGER DEFAULT 50`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE hunts ADD COLUMN max_price REAL`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE hunts ADD COLUMN min_price REAL`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE hunts ADD COLUMN sources TEXT DEFAULT '{"ebay":true,"etsy":true,"facebook":true,"craigslist":true,"mercari":true,"firstdibs":true,"chairish":true,"aptdeco":true,"offerup":true}'`);
} catch (e) { /* column exists */ }
try {
  db.exec(`ALTER TABLE hunts ADD COLUMN listing_age TEXT DEFAULT 'any'`);
} catch (e) { /* column exists */ }

export interface Project {
  id: string;
  name: string;
  description: string;
  style_summary: string;
  location?: string;
  zip_code?: string;
  search_radius: number;
  auto_scout_enabled: boolean;
  auto_scout_time: string;
  default_max_price: number;
  color?: string;
  item_count?: number;
}

export interface Item {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  price?: number;
  image_url?: string;
  listing_url?: string;
  source?: string;
  location?: string;
  category?: string;
  condition?: string;
  overall_score?: number;
  status: string;
  created_at: string;
}

export interface ScoutQuery {
  id: string;
  project_id: string;
  query: string;
  priority: number;
  enabled: boolean;
  last_run?: string;
  items_found: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  hunt_id?: string;
  role: string;
  content: string;
  created_at: string;
}

export interface Hunt {
  id: string;
  project_id?: string;
  title: string;
  is_pinned: boolean;
  saved_count: number;
  items_returned: number;
  best_price?: number;
  zip_code?: string;
  search_radius: number;
  min_price?: number;
  max_price?: number;
  sources?: string; // JSON string of marketplace toggles
  listing_age?: string;
  created_at: string;
  updated_at: string;
}

export function getProjects(): Project[] {
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[];
}

export function getProject(id: string): Project | undefined {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;
}

export function createProject(name: string, description: string, style_summary: string, default_max_price: number = 200) {
  const id = Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT INTO projects (id, name, description, style_summary, default_max_price) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, description, style_summary, default_max_price);
  return getProject(id);
}

export function getChatMessages(projectId: string): ChatMessage[] {
  return db.prepare('SELECT * FROM chat_messages WHERE project_id = ? ORDER BY created_at ASC').all(projectId) as ChatMessage[];
}

export function addChatMessage(projectId: string, role: string, content: string) {
  const id = Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT INTO chat_messages (id, project_id, role, content) VALUES (?, ?, ?, ?)')
    .run(id, projectId, role, content);
}

// Project settings
export function updateProject(id: string, updates: Partial<Project>) {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'item_count');
  if (fields.length === 0) return;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (updates as any)[f]);
  db.prepare(`UPDATE projects SET ${setClause} WHERE id = ?`).run(...values, id);
}

export function getProjectsWithCounts(): Project[] {
  return db.prepare(`
    SELECT p.*, COUNT(i.id) as item_count
    FROM projects p
    LEFT JOIN items i ON p.id = i.project_id AND i.status = 'saved'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all() as Project[];
}

// Items
export function getItems(projectId: string, status?: string): Item[] {
  if (status) {
    return db.prepare('SELECT * FROM items WHERE project_id = ? AND status = ? ORDER BY created_at DESC')
      .all(projectId, status) as Item[];
  }
  return db.prepare('SELECT * FROM items WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId) as Item[];
}

export function getDailyFinds(projectId: string): Item[] {
  // Get items from the last 24 hours that are 'new' status
  return db.prepare(`
    SELECT * FROM items
    WHERE project_id = ? AND status = 'new'
    AND created_at > datetime('now', '-1 day')
    ORDER BY overall_score DESC, created_at DESC
  `).all(projectId) as Item[];
}

export function getSavedItems(projectId: string): Item[] {
  return db.prepare('SELECT * FROM items WHERE project_id = ? AND status = ?')
    .all(projectId, 'saved') as Item[];
}

export function addItem(item: Omit<Item, 'id' | 'created_at'>): Item {
  const id = Math.random().toString(36).substring(2, 9);
  db.prepare(`
    INSERT INTO items (id, project_id, title, description, price, image_url, listing_url, source, location, category, condition, overall_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, item.project_id, item.title, item.description, item.price, item.image_url, item.listing_url, item.source, item.location, item.category, item.condition, item.overall_score, item.status || 'new');
  return db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item;
}

export function updateItemStatus(id: string, status: string) {
  db.prepare('UPDATE items SET status = ? WHERE id = ?').run(status, id);
}

// Stats
export function getStats() {
  const savedThisWeek = db.prepare(`
    SELECT COUNT(*) as count FROM items
    WHERE status = 'saved' AND created_at > datetime('now', '-7 days')
  `).get() as { count: number };

  const tracking = db.prepare(`
    SELECT COUNT(*) as count FROM items WHERE status IN ('saved', 'new')
  `).get() as { count: number };

  const greatDeals = db.prepare(`
    SELECT COUNT(*) as count FROM items
    WHERE overall_score >= 90 AND status = 'new'
  `).get() as { count: number };

  return {
    saved_this_week: savedThisWeek.count,
    tracking: tracking.count,
    great_deals: greatDeals.count
  };
}

// Auto-scout
export function getAutoScoutProjects(): Project[] {
  return db.prepare('SELECT * FROM projects WHERE auto_scout_enabled = 1').all() as Project[];
}

export function createScoutRun(projectId: string) {
  const id = Math.random().toString(36).substring(2, 9);
  db.prepare(`INSERT INTO scout_runs (id, project_id, status, started_at) VALUES (?, ?, 'running', datetime('now'))`).run(id, projectId);
  return id;
}

export function completeScoutRun(runId: string, itemsFound: number) {
  db.prepare(`UPDATE scout_runs SET status = 'completed', items_found = ?, completed_at = datetime('now') WHERE id = ?`).run(itemsFound, runId);
}

// Scout Queries
export function getScoutQueries(projectId: string): ScoutQuery[] {
  return db.prepare('SELECT * FROM scout_queries WHERE project_id = ? ORDER BY priority ASC, created_at ASC')
    .all(projectId) as ScoutQuery[];
}

export function addScoutQuery(projectId: string, query: string, priority: number = 0): ScoutQuery {
  const id = Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT INTO scout_queries (id, project_id, query, priority) VALUES (?, ?, ?, ?)')
    .run(id, projectId, query, priority);
  return db.prepare('SELECT * FROM scout_queries WHERE id = ?').get(id) as ScoutQuery;
}

export function updateScoutQuery(id: string, updates: Partial<ScoutQuery>) {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'project_id' && k !== 'created_at');
  if (fields.length === 0) return;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (updates as any)[f]);
  db.prepare(`UPDATE scout_queries SET ${setClause} WHERE id = ?`).run(...values, id);
}

export function deleteScoutQuery(id: string) {
  db.prepare('DELETE FROM scout_queries WHERE id = ?').run(id);
}

export function updateScoutQueryRun(id: string, itemsFound: number) {
  db.prepare(`UPDATE scout_queries SET last_run = datetime('now'), items_found = ? WHERE id = ?`).run(itemsFound, id);
}

// Hunts
export function getHunts(projectId?: string): Hunt[] {
  if (projectId) {
    return db.prepare('SELECT * FROM hunts WHERE project_id = ? ORDER BY updated_at DESC')
      .all(projectId) as Hunt[];
  }
  return db.prepare('SELECT * FROM hunts ORDER BY updated_at DESC').all() as Hunt[];
}

export function getUnsortedHunts(): Hunt[] {
  return db.prepare('SELECT * FROM hunts WHERE project_id IS NULL ORDER BY updated_at DESC').all() as Hunt[];
}

export function getPinnedHunts(): Hunt[] {
  return db.prepare('SELECT * FROM hunts WHERE is_pinned = 1 ORDER BY updated_at DESC').all() as Hunt[];
}

export function getHunt(id: string): Hunt | undefined {
  return db.prepare('SELECT * FROM hunts WHERE id = ?').get(id) as Hunt;
}

export function createHunt(title: string, projectId?: string): Hunt {
  const id = Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT INTO hunts (id, project_id, title) VALUES (?, ?, ?)')
    .run(id, projectId || null, title);
  return getHunt(id)!;
}

export function updateHunt(id: string, updates: Partial<Hunt>) {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (updates as any)[f]);
  db.prepare(`UPDATE hunts SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
}

export function deleteHunt(id: string) {
  db.prepare('DELETE FROM chat_messages WHERE hunt_id = ?').run(id);
  db.prepare('DELETE FROM hunts WHERE id = ?').run(id);
}

export function getHuntMessages(huntId: string): ChatMessage[] {
  return db.prepare('SELECT * FROM chat_messages WHERE hunt_id = ? ORDER BY created_at ASC')
    .all(huntId) as ChatMessage[];
}

export function addHuntMessage(huntId: string, role: string, content: string) {
  const id = Math.random().toString(36).substring(2, 9);
  const hunt = getHunt(huntId);
  db.prepare('INSERT INTO chat_messages (id, project_id, hunt_id, role, content) VALUES (?, ?, ?, ?, ?)')
    .run(id, hunt?.project_id || null, huntId, role, content);
  // Update hunt's updated_at timestamp
  db.prepare(`UPDATE hunts SET updated_at = datetime('now') WHERE id = ?`).run(huntId);
}

export function getHuntsGroupedByProject(): { projects: { project: Project; hunts: Hunt[] }[]; unsorted: Hunt[]; pinned: Hunt[] } {
  const projects = getProjects();
  const result = {
    projects: projects.map(p => ({
      project: p,
      hunts: getHunts(p.id).filter(h => !h.is_pinned)
    })).filter(p => p.hunts.length > 0),
    unsorted: getUnsortedHunts().filter(h => !h.is_pinned),
    pinned: getPinnedHunts()
  };
  return result;
}
