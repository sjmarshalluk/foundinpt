// Data layer for the foundinpt Astro build.
// Imported via Vite at build time — JSON never lands in dist/.

import entitiesRaw from '../data/entities.json';
import directoryRaw from '../data/directory.json';

export const entities = entitiesRaw;
export const directory = directoryRaw;

export function entityById(id) {
  return entities.find((e) => e.id === id) || null;
}

export function allCategories(list = directory) {
  const set = new Set();
  for (const e of list) for (const c of (e.categories || [])) set.add(c);
  return [...set].sort();
}

// Top-level partition. Four buckets:
// - ARTISTS:  individuals making expressive work (painters, photographers, writers).
// - MAKERS:   individuals/orgs producing functional craft (food, jewelry, woodwork).
// - SPACES:   galleries, studios, makerspaces, supplies.
// - EVENTS:   facilitators, classes, venues, museums, theaters, farms.
// An entity may appear on multiple pages.
//
// Artist sub-cats — discipline / medium of expressive work
export const ARTIST_SUBCATEGORIES = new Set([
  'Painting',
  'Sculpture',
  'Fibre & Textile',
  'Photography',
  'Printmaking',
  'Mixed Media',
  'Writing',
  'Performance',     // dance, theatre acts, choreographers
  'Tattoo',
  'Music',           // hidden today but reserved
]);
// Maker sub-cats — kind of object/output
export const MAKER_SUBCATEGORIES = new Set([
  'Jewelry',
  'Woodwork',
  'Metalwork',
  'Glass',
  'Ceramics',
  'Leather',
  'Paper & Stationery',
  'Soap & Body Care',
  'Functional Textile',
]);

// Farms & Producers — its own top-level page. Anything tagged with these gets
// routed off /artists and onto /farms.
export const FARM_CATEGORIES = new Set([
  'Food & Drink',
  'Farm', 'Dairy', 'Creamery',
  'Bakery', 'Chocolate', 'Ice Cream', 'Sweets',
  'Brewery', 'Cidery', 'Vineyard', 'Winery', 'Distillery',
  'Coffee',
]);
// Backward-compat union — anything that puts an entity on /artists or /makers.
// "Studio" is here because solo-studio tags should still route somewhere
// (kind:person fallback handles it, dropping into Artists → Other section).
export const CREATOR_CATEGORIES = new Set([
  'Artist', 'Maker',
  ...ARTIST_SUBCATEGORIES, ...MAKER_SUBCATEGORIES,
  'Studio',
  'Dance',  // legacy alias for Performance
]);
// /spaces — galleries (and via local-goods/supplies sets, boutiques + suppliers).
// Studios/makerspaces moved to /studios-and-classes.
export const SPACE_CATEGORIES   = new Set([
  'Gallery',
]);
// /studios-and-classes (studios half) — physical workspaces, makerspaces.
export const STUDIO_CATEGORIES  = new Set([
  'Space', 'Makerspace',
]);
// /studios-and-classes (classes half) — facilitators (individuals running
// programs), classes, venues, museums, theaters, etc. (Farms have their own page.)
export const EVENT_CATEGORIES   = new Set([
  'Facilitator',
  'Classes',
  'Venue', 'Theater', 'Museum', 'Bookstore',
  'Nonprofit',
]);
export const SUPPLY_CATEGORIES     = new Set(['Supplies', 'Shop']);
// Boutiques / trinket shops / curated local-product shops. Not pure
// raw-material suppliers — different shopping intent.
export const LOCAL_GOODS_CATEGORIES = new Set(['Local Goods']);

// Categories that imply a physical place where you can walk in and buy
// locally-made things. Used by /shop's "Browse local shops" section.
export const IN_PERSON_RETAIL_CATEGORIES = new Set([
  'Local Goods', 'Gallery',
  'Farm', 'Dairy', 'Creamery',
  'Bakery', 'Chocolate', 'Ice Cream', 'Sweets',
  'Brewery', 'Cidery', 'Vineyard', 'Winery', 'Distillery',
  'Coffee',
]);

// Entities in these categories sell consumables (beer cans, coffee beans, jugs of cider)
// where surfacing per-SKU products in /shop's product grid feels off-brand.
// They still appear in "Shop direct from makers" and "Browse local shops" sections.
const HIDE_PRODUCTS_FOR_CATEGORIES = new Set(['Brewery', 'Cidery', 'Coffee']);

export function isFarm(entity) {
  return (entity.categories || []).some((c) => FARM_CATEGORIES.has(c));
}
export function isMaker(entity) {
  // Farms/producers have their own page.
  if (isFarm(entity)) return false;
  const cats = entity.categories || [];
  if (cats.includes('Maker')) return true;
  return cats.some((c) => MAKER_SUBCATEGORIES.has(c));
}
export function isArtist(entity) {
  // Farm and Maker take priority if dual-tagged.
  if (isFarm(entity)) return false;
  if (isMaker(entity)) return false;
  const cats = entity.categories || [];
  // Any creator-side tag (Artist top, Artist sub, or legacy Studio/Dance).
  if (cats.some((c) => CREATOR_CATEGORIES.has(c))) return true;
  // kind:person fallback — solo individuals without any creator tag.
  return entity.kind === 'person';
}
// Back-compat: union of artist + maker. Some places in the codebase may still
// reference creators/isCreator.
export function isCreator(entity) {
  return isArtist(entity) || isMaker(entity);
}
export function isSpace(entity) {
  // kind: person → only on /spaces if they have an explicit space category.
  if (entity.kind === 'person') {
    return (entity.categories || []).some((c) => SPACE_CATEGORIES.has(c));
  }
  if ((entity.categories || []).some((c) => SPACE_CATEGORIES.has(c))) return true;
  // Orphan with no categories at all — default to space (places-sourced fallback).
  if (!entity.categories?.length) return true;
  return false;
}
export function isEvent(entity) {
  return (entity.categories || []).some((c) => EVENT_CATEGORIES.has(c));
}
export function isStudio(entity) {
  return (entity.categories || []).some((c) => STUDIO_CATEGORIES.has(c));
}
export function isSupply(entity) {
  return (entity.categories || []).some((c) => SUPPLY_CATEGORIES.has(c));
}
export function isLocalGoods(entity) {
  return (entity.categories || []).some((c) => LOCAL_GOODS_CATEGORIES.has(c));
}

// True if entity has any online-buyable surface (products, or a shop URL).
export function sellsOnline(entity) {
  return Boolean(entity?.products?.length) || Boolean(entity?.shop_url);
}

// True if entity is a physical place where you can walk in and buy. Requires
// an `address` (so it's actually visitable) plus a retail-implying category.
// Set `entity.sells_in_person: false` to opt-out (e.g. galleries that don't sell).
export function sellsInPerson(entity) {
  if (!entity?.address) return false;
  if (entity.sells_in_person === false) return false;
  return (entity.categories || []).some((c) => IN_PERSON_RETAIL_CATEGORIES.has(c));
}

export function artists(list = entities) {
  return list.filter(isArtist);
}
export function makers(list = entities) {
  return list.filter(isMaker);
}
export function farms(list = entities) {
  return list.filter(isFarm);
}
// Back-compat
export function creators(list = entities) {
  return list.filter(isCreator);
}
export function spaces(list = entities) {
  return list.filter(isSpace);
}
export function events(list = entities) {
  return list.filter(isEvent);
}
export function studios(list = entities) {
  return list.filter(isStudio);
}
export function supplies(list = entities) {
  return list.filter(isSupply);
}
export function localGoods(list = entities) {
  return list.filter(isLocalGoods);
}

// Visible filter shared by all /shop list helpers — hidden entities and those
// still in manualReview don't get surfaced.
function isShopVisible(e) {
  return e.showOnSite !== false && !e.audit?.manualReview;
}

// Flatten products across all visible entities into [{ product, entity }] pairs.
// Skips products from HIDE_PRODUCTS_FOR_CATEGORIES (consumables) and any product
// missing a URL or image.
export function allProducts(list = entities) {
  const out = [];
  for (const e of list) {
    if (!isShopVisible(e)) continue;
    if ((e.categories || []).some((c) => HIDE_PRODUCTS_FOR_CATEGORIES.has(c))) continue;
    for (const p of e.products || []) {
      if (!p.product_url || !p.image_url) continue;
      out.push({ product: p, entity: e });
    }
  }
  return out;
}

export function entitiesSellingOnline(list = entities) {
  return list.filter((e) => isShopVisible(e) && sellsOnline(e));
}

export function entitiesSellingInPerson(list = entities) {
  return list.filter((e) => isShopVisible(e) && sellsInPerson(e));
}

// /artists sections: one per ARTIST_SUBCATEGORIES, plus 'Other' fallback.
// Kept for back-compat / future use; not currently consumed by any page.
export function artistSection(entity) {
  const cats = entity.categories || [];
  for (const sub of ARTIST_SUBCATEGORIES) {
    if (cats.includes(sub)) return sub;
  }
  if (cats.includes('Dance')) return 'Performance';
  return 'Other';
}
export function makerSection(entity) {
  const cats = entity.categories || [];
  for (const sub of MAKER_SUBCATEGORIES) {
    if (cats.includes(sub)) return sub;
  }
  return 'Other';
}

// Consolidated Artists & Makers sub-sections. Order = render order.
// Empty sections are hidden by the page so the visible set adapts to data.
export const CREATOR_SECTIONS = [
  { label: 'Painting, Mixed Media & Print', cats: ['Painting', 'Mixed Media', 'Printmaking'] },
  { label: 'Photography',                   cats: ['Photography'] },
  { label: 'Sculpture, Wood & Metal',       cats: ['Sculpture', 'Woodwork', 'Metalwork'] },
  { label: 'Ceramics & Glass',              cats: ['Ceramics', 'Glass'] },
  { label: 'Fibre, Textile & Wearable',     cats: ['Fibre & Textile', 'Functional Textile', 'Jewelry', 'Leather'] },
  { label: 'Words, Performance & Tattoo',   cats: ['Writing', 'Performance', 'Dance', 'Music', 'Tattoo'] },
  { label: 'Home & Body Goods',             cats: ['Soap & Body Care', 'Paper & Stationery'] },
];

// /farms page sections. Order = render order. Empty sections are hidden.
export const FARM_SECTIONS = [
  { label: 'Farms',                cats: ['Farm'] },
  { label: 'Dairy & Creamery',     cats: ['Dairy', 'Creamery'] },
  { label: 'Bakery & Sweets',      cats: ['Bakery', 'Chocolate', 'Ice Cream', 'Sweets'] },
  { label: 'Breweries & Cideries', cats: ['Brewery', 'Cidery'] },
  { label: 'Vineyards',            cats: ['Vineyard', 'Winery'] },
  { label: 'Distilleries',         cats: ['Distillery'] },
  { label: 'Coffee Roasters',      cats: ['Coffee'] },
];

export function farmSection(entity) {
  const cats = entity.categories || [];
  for (const sec of FARM_SECTIONS) {
    if (cats.some((c) => sec.cats.includes(c))) return sec.label;
  }
  return 'Farms'; // default — most Food & Drink-only entries are farms
}

export function creatorSection(entity) {
  const cats = entity.categories || [];
  for (const sec of CREATOR_SECTIONS) {
    if (cats.some((c) => sec.cats.includes(c))) return sec.label;
  }
  return 'Other';
}

// /spaces is sectioned into three groups (priority order):
//   1. Galleries     — has Gallery category
//   2. Local Goods   — has 'Local Goods' (boutiques / curated shops)
//   3. Supplies      — has Shop or Supplies
// (Studios & Makerspaces moved to /studios-and-classes.)
export function spaceSection(entity) {
  const cats = entity.categories || [];
  if (cats.includes('Gallery')) return 'galleries';
  if (cats.includes('Local Goods')) return 'local-goods';
  if (cats.includes('Shop') || cats.includes('Supplies')) return 'supplies';
  return 'galleries'; // orphan fallback
}

// /studios-and-classes is sectioned into three groups (priority order):
//   1. Studios & Makerspaces   — has Space or Makerspace
//   2. Facilitators            — has Facilitator (individuals/orgs running programs)
//   3. Community & Event Spaces — Classes, Venue, Theater, Museum, etc.
export function studioOrEventSection(entity) {
  const cats = entity.categories || [];
  if (cats.some((c) => STUDIO_CATEGORIES.has(c))) return 'studios';
  if (cats.includes('Facilitator')) return 'facilitators';
  return 'community';
}

// Back-compat alias — older callers used eventSection() for the events page.
export function eventSection(entity) {
  return studioOrEventSection(entity);
}

// Hash slug for a stable color from name string. Used by the colored-block
// thumb fallback when no image is available.
export function hashColor(s) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  // Soft, warm palette — riffs on the existing site's coral / tan / sky.
  const palette = ['#D4C5B2', '#B8C9D4', '#C9BFA8', '#9EAFC0', '#D4B8B0', '#BFCAB0', '#E0CFB8', '#C5C5B5'];
  return palette[Math.abs(h) % palette.length];
}

export function displayName(entity) {
  if (!entity) return '';
  if (entity.personName && entity.businessName) return `${entity.personName} (${entity.businessName})`;
  return entity.personName || entity.businessName || '(unnamed)';
}

export function shortName(entity) {
  // Tighter version for cards — drop the alias parens.
  if (!entity) return '';
  return entity.personName || entity.businessName || '(unnamed)';
}

// Resolves the image src — prefer locally hosted, fall back to remote URL.
// Returns null if neither.
export function heroImageSrc(entity) {
  if (!entity) return null;
  if (entity.hero_image_local) return `/images/${entity.id}/${entity.hero_image_local}`;
  return entity.hero_image_url || null;
}

export function localGallerySrcs(entity) {
  if (!entity || !Array.isArray(entity.local_images)) return [];
  return entity.local_images.map((f) => `/images/${entity.id}/${f}`);
}

// Combined gallery: local images first (best quality), then remote gallery URLs
// from enrichment (hot-linked from artist's own site). De-duped and excludes
// whatever's already the hero.
export function gallerySrcs(entity) {
  if (!entity) return [];
  const hero = heroImageSrc(entity);
  const local = localGallerySrcs(entity);
  const remote = Array.isArray(entity.gallery_image_urls) ? entity.gallery_image_urls : [];
  const seen = new Set();
  if (hero) seen.add(hero);
  const out = [];
  for (const u of [...local, ...remote]) {
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

// Every external link the entity has, in stable order. Each is { kind, url, label }.
const LINK_KINDS = [
  { kind: 'website',   label: 'Website' },
  { kind: 'instagram', label: 'Instagram' },
  { kind: 'facebook',  label: 'Facebook' },
  { kind: 'youtube',   label: 'YouTube' },
  { kind: 'tiktok',    label: 'TikTok' },
  { kind: 'bluesky',   label: 'Bluesky' },
  { kind: 'threads',   label: 'Threads' },
  { kind: 'twitter',   label: 'X / Twitter' },
  { kind: 'pinterest', label: 'Pinterest' },
  { kind: 'vimeo',     label: 'Vimeo' },
  { kind: 'etsy',      label: 'Etsy' },
  { kind: 'shop_url',  label: 'Shop' },
];

export function externalLinks(entity) {
  if (!entity) return [];
  const out = [];
  for (const { kind, label } of LINK_KINDS) {
    const url = entity[kind];
    if (url) out.push({ kind, label, url });
  }
  return out;
}

// Build a Google Maps directions URL from address fields. Prefers lat/lng if present.
export function directionsUrl(entity) {
  if (!entity) return null;
  if (entity.lat && entity.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${entity.lat},${entity.lng}`;
  }
  const parts = [entity.address, entity.address_line2, entity.town, entity.state || 'WA'].filter(Boolean);
  if (!parts.length) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts.join(', '))}`;
}

// Resolve final CTA button list for the Visit block. If the entity has any
// address but no explicit "Get directions" CTA, auto-injects one as the
// primary button. Falls back: first remaining button is primary if none
// flagged.
export function resolveCtaButtons(entity) {
  if (!entity) return [];
  const buttons = Array.isArray(entity.cta_buttons) ? entity.cta_buttons.map((b) => ({ ...b })) : [];
  const hasDirections = buttons.some((b) => /direction/i.test(b.label || ''));
  const url = directionsUrl(entity);
  if (!hasDirections && url) {
    buttons.unshift({ label: 'Get directions', url, primary: true });
  }
  if (buttons.length && !buttons.some((b) => b.primary)) buttons[0].primary = true;
  return buttons;
}

// Pick up to N entities that share a category with the given entity, excluding
// itself, hidden entities, and (by default) entities still in manualReview.
// Higher overlap-count = higher priority; ties broken by id for stable order.
export function relatedEntities(entity, n = 4, { includeReview = false } = {}) {
  if (!entity) return [];
  const myCats = new Set(entity.categories || []);
  if (!myCats.size) return [];
  const matches = entities.filter((e) => {
    if (e.id === entity.id) return false;
    if (e.showOnSite === false) return false;
    if (!includeReview && e.audit?.manualReview) return false;
    return (e.categories || []).some((c) => myCats.has(c));
  });
  matches.sort((a, b) => {
    const sa = (a.categories || []).filter((c) => myCats.has(c)).length;
    const sb = (b.categories || []).filter((c) => myCats.has(c)).length;
    return sb - sa || a.id.localeCompare(b.id);
  });
  return matches.slice(0, n);
}

// Generic top-level category names that aren't useful as a display tag — we'd
// rather show a specific sub-cat or skill underneath.
const GENERIC_DISPLAY_TAGS = new Set(['Artist', 'Maker', 'Studio', 'Dance']);

// Compact discipline label for cards & headers. Looks at, in order:
//   1. entity.title  (free-form professional title set by curator)
//   2. first specific (non-generic) category
//   3. first skill that contains a capital letter (looks like a title)
//   4. first category at all
//   5. first skill
//   6. kind
export function primaryTag(entity) {
  if (!entity) return '';
  if (entity.title) return entity.title;
  const cats = entity.categories || [];
  const skills = entity.skills || [];
  const specificCat = cats.find((c) => !GENERIC_DISPLAY_TAGS.has(c));
  if (specificCat) return specificCat;
  const titleSkill = skills.find((s) => /[A-Z]/.test(s));
  if (titleSkill) return titleSkill;
  if (cats.length) return cats[0];
  if (skills.length) return skills[0];
  return entity.kind || '';
}
