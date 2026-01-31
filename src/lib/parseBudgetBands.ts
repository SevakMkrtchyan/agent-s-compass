/**
 * Parses budget band information from AI-generated artifact content.
 * 
 * Expected patterns:
 * - "Conservative band: $450,000 - $520,000" or "Conservative: $450K - $520K"
 * - "Target band: $500,000 - $560,000"
 * - "Stretch band: $560,000 - $580,000"
 * 
 * Also handles markdown formatting like **Conservative**, headers, etc.
 */

export interface BudgetBands {
  conservative_min: number | null;
  conservative_max: number | null;
  target_min: number | null;
  target_max: number | null;
  stretch_min: number | null;
  stretch_max: number | null;
}

/**
 * Parses a price string into a number
 * Handles formats like: "$450,000", "$450K", "450000", "$1.2M"
 */
function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null;
  
  // Remove $ and commas, trim
  let cleaned = priceStr.replace(/[$,\s]/g, '').trim();
  
  // Handle K notation (e.g., "450K" → 450000)
  if (/k$/i.test(cleaned)) {
    const num = parseFloat(cleaned.replace(/k$/i, ''));
    return isNaN(num) ? null : num * 1000;
  }
  
  // Handle M notation (e.g., "1.2M" → 1200000)
  if (/m$/i.test(cleaned)) {
    const num = parseFloat(cleaned.replace(/m$/i, ''));
    return isNaN(num) ? null : num * 1000000;
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Extracts min and max values from a range string
 * Handles formats like: "$450,000 - $520,000", "$450K-$520K", "450000 to 520000"
 */
function extractRange(text: string): { min: number | null; max: number | null } {
  // Match patterns like "$450,000 - $520,000" or "$450K-$520K"
  // Capture price patterns on either side of a separator (-, –, to)
  const rangePattern = /\$?[\d,]+\.?\d*[KkMm]?\s*(?:-|–|to)\s*\$?[\d,]+\.?\d*[KkMm]?/gi;
  const matches = text.match(rangePattern);
  
  if (!matches || matches.length === 0) {
    return { min: null, max: null };
  }
  
  // Use the first match
  const rangeMatch = matches[0];
  
  // Split by separator
  const parts = rangeMatch.split(/\s*(?:-|–|to)\s*/i);
  
  if (parts.length >= 2) {
    return {
      min: parsePrice(parts[0]),
      max: parsePrice(parts[1]),
    };
  }
  
  return { min: null, max: null };
}

/**
 * Finds a band section in the content and extracts its range
 */
function findBandRange(content: string, bandName: string): { min: number | null; max: number | null } {
  // Create patterns to match the band name followed by a range
  // Match lines like:
  // "**Conservative Band**: $450,000 - $520,000"
  // "Conservative: $450K - $520K"
  // "### Conservative Band\n$450,000 - $520,000"
  // "- Conservative band: $450,000 - $520,000"
  
  const patterns = [
    // Pattern 1: Band name with colon followed by range on same line
    new RegExp(`(?:\\*\\*)?${bandName}(?:\\s+band)?(?:\\*\\*)?[:\\s]+([^\\n]+)`, 'i'),
    // Pattern 2: Band name as header followed by range on next line
    new RegExp(`(?:#+\\s*)?${bandName}(?:\\s+band)?[:\\s]*\\n+([^\\n]+)`, 'i'),
    // Pattern 3: List item with band name
    new RegExp(`[-•]\\s*(?:\\*\\*)?${bandName}(?:\\s+band)?(?:\\*\\*)?[:\\s]+([^\\n]+)`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const range = extractRange(match[1]);
      if (range.min !== null && range.max !== null) {
        return range;
      }
    }
  }
  
  return { min: null, max: null };
}

/**
 * Parses AI-generated content to extract budget bands
 * Returns null if no budget bands are found
 */
export function parseBudgetBands(content: string): BudgetBands | null {
  if (!content) return null;
  
  const conservative = findBandRange(content, 'conservative');
  const target = findBandRange(content, 'target');
  const stretch = findBandRange(content, 'stretch');
  
  // Check if we found at least one complete band
  const hasAnyBand = 
    (conservative.min !== null && conservative.max !== null) ||
    (target.min !== null && target.max !== null) ||
    (stretch.min !== null && stretch.max !== null);
  
  if (!hasAnyBand) {
    return null;
  }
  
  return {
    conservative_min: conservative.min,
    conservative_max: conservative.max,
    target_min: target.min,
    target_max: target.max,
    stretch_min: stretch.min,
    stretch_max: stretch.max,
  };
}

/**
 * Checks if the content appears to be a budget bands artifact
 * Based on keywords in the content
 */
export function isBudgetBandsArtifact(content: string): boolean {
  if (!content) return false;
  
  const lowerContent = content.toLowerCase();
  
  // Check for budget band-related keywords
  const keywords = [
    'budget band',
    'budget bands',
    'conservative band',
    'target band',
    'stretch band',
    'realistic budget',
    'price range',
    'purchasing power',
  ];
  
  const matchCount = keywords.filter(kw => lowerContent.includes(kw)).length;
  
  // Require at least 2 keyword matches to be confident this is a budget bands artifact
  return matchCount >= 2;
}
