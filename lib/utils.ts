/**
 * Strips scraped e-commerce noise from product titles.
 * Handles " - Buy ...", " - Flipkart.com", repeated phrases, etc.
 */
export function cleanProductTitle(name: string): string {
  if (!name) return name;
  let t = name;

  // Remove " - Buy [anything]" suffix (most common scraping artifact)
  t = t.replace(/\s+[-–—]\s+Buy\s+.*/i, '');

  // Remove trailing platform domain references
  t = t.replace(
    /\s+[-–—]\s+(Flipkart(?:\.com)?|Amazon(?:\.in|\.com)?|Meesho(?:\.com)?|Myntra(?:\.com)?|Snapdeal(?:\.com)?|Nykaa(?:\.com)?).*$/i,
    ''
  );

  // Remove generic e-commerce phrase tails
  t = t.replace(
    /\s+[-–—]\s+(Online|Best Price|Lowest Price|Latest Price|Shop Online|at Amazon|at Flipkart).*$/i,
    ''
  );

  // Remove trailing orphan separators
  t = t.replace(/\s*[-–—]+\s*$/, '').trim();

  return t || name;
}
