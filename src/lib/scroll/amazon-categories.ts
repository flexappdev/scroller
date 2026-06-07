/**
 * Static catalog of every Amazon UK Best-Sellers top-level category
 * (https://www.amazon.co.uk/Best-Sellers/zgbs). Each entry carries the zgbs
 * slug Amazon uses in the URL — that slug IS the canonical id for the
 * category. Full ASIN-level scraping needs PA-API; this list surfaces every
 * category landing page so the /amazon route is never empty.
 */
export type AmazonZgbsCategory = {
  id: string;          // zgbs slug, e.g. "books"
  name: string;
  description: string;
  url: string;         // https://www.amazon.co.uk/Best-Sellers/zgbs/<id>
  accent: string;
};

const BASE = "https://www.amazon.co.uk/Best-Sellers/zgbs";

export const AMAZON_ZGBS_CATEGORIES: AmazonZgbsCategory[] = [
  { id: "books", name: "Books", description: "All Books", accent: "#ec4899", url: `${BASE}/books` },
  { id: "electronics", name: "Electronics & Photo", description: "Electronics", accent: "#06b6d4", url: `${BASE}/electronics` },
  { id: "computers", name: "Computers & Accessories", description: "Computing", accent: "#3b82f6", url: `${BASE}/computers` },
  { id: "videogames", name: "PC & Video Games", description: "Gaming", accent: "#a78bfa", url: `${BASE}/videogames` },
  { id: "kitchen", name: "Home & Kitchen", description: "Home & Kitchen", accent: "#10b981", url: `${BASE}/kitchen` },
  { id: "diy", name: "DIY & Tools", description: "DIY", accent: "#f59e0b", url: `${BASE}/diy` },
  { id: "garden", name: "Garden & Outdoors", description: "Garden", accent: "#22c55e", url: `${BASE}/garden` },
  { id: "beauty", name: "Beauty", description: "Beauty", accent: "#f472b6", url: `${BASE}/beauty` },
  { id: "drugstore", name: "Health & Personal Care", description: "Drugstore", accent: "#ef4444", url: `${BASE}/drugstore` },
  { id: "fashion", name: "Fashion", description: "Fashion", accent: "#e879f9", url: `${BASE}/fashion` },
  { id: "shoes", name: "Shoes & Bags", description: "Shoes", accent: "#fb923c", url: `${BASE}/shoes` },
  { id: "watches", name: "Watches", description: "Watches", accent: "#facc15", url: `${BASE}/watches` },
  { id: "jewellery", name: "Jewellery", description: "Jewellery", accent: "#fde047", url: `${BASE}/jewellery` },
  { id: "lighting", name: "Lighting", description: "Lighting", accent: "#fbbf24", url: `${BASE}/lighting` },
  { id: "kitchen-appliances", name: "Large Appliances", description: "Large Appliances", accent: "#0ea5e9", url: `${BASE}/kitchen-appliances` },
  { id: "office-products", name: "Office Products", description: "Office", accent: "#6366f1", url: `${BASE}/office-products` },
  { id: "stationery", name: "Stationery & Office Supplies", description: "Stationery", accent: "#818cf8", url: `${BASE}/stationery` },
  { id: "pet-supplies", name: "Pet Supplies", description: "Pets", accent: "#84cc16", url: `${BASE}/pet-supplies` },
  { id: "baby", name: "Baby Products", description: "Baby", accent: "#fbcfe8", url: `${BASE}/baby` },
  { id: "toys", name: "Toys & Games", description: "Toys", accent: "#f97316", url: `${BASE}/toys` },
  { id: "sports", name: "Sports & Outdoors", description: "Sports", accent: "#16a34a", url: `${BASE}/sports` },
  { id: "automotive", name: "Automotive", description: "Auto", accent: "#dc2626", url: `${BASE}/automotive` },
  { id: "musical-instruments", name: "Musical Instruments & DJ", description: "Music gear", accent: "#a855f7", url: `${BASE}/musical-instruments` },
  { id: "music", name: "CDs & Vinyl", description: "Music CDs", accent: "#7c3aed", url: `${BASE}/music` },
  { id: "dvd", name: "DVD & Blu-ray", description: "Film & TV", accent: "#9333ea", url: `${BASE}/dvd` },
  { id: "software", name: "Software", description: "Software", accent: "#2563eb", url: `${BASE}/software` },
  { id: "videogames-downloads", name: "PC Games Download", description: "Game Downloads", accent: "#8b5cf6", url: `${BASE}/videogames-downloads` },
  { id: "appliances", name: "Appliances", description: "Appliances", accent: "#0891b2", url: `${BASE}/appliances` },
  { id: "grocery", name: "Grocery", description: "Grocery", accent: "#15803d", url: `${BASE}/grocery` },
  { id: "industrial", name: "Business, Industry & Science", description: "Industrial", accent: "#475569", url: `${BASE}/industrial` },
  { id: "lawn-garden", name: "Lawn & Garden", description: "Lawn", accent: "#65a30d", url: `${BASE}/lawn-garden` },
  { id: "luggage", name: "Luggage & Travel Gear", description: "Luggage", accent: "#0369a1", url: `${BASE}/luggage` },
  { id: "kindle-store", name: "Kindle Store", description: "Kindle", accent: "#0d9488", url: `${BASE}/kindle-store` },
  { id: "digital-text", name: "Kindle eBooks", description: "eBooks", accent: "#14b8a6", url: `${BASE}/digital-text` },
];
