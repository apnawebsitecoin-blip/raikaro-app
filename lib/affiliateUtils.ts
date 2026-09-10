import { supabase } from './supabase';

export type AffiliatePlatform = 'amazon' | 'flipkart' | 'meesho' | 'myntra';

export interface AffiliateSetting {
  platform: AffiliatePlatform;
  affiliate_tag: string;
  is_active: boolean;
  updated_at: string;
}

// Affiliate query-param names per platform
const PARAM_MAP: Record<AffiliatePlatform, string> = {
  amazon:   'tag',
  flipkart: 'affid',
  meesho:   'ref',
  myntra:   'utm_source',
};

export const PLATFORM_META: Record<AffiliatePlatform, { label: string; paramLabel: string; hint: string; color: string; bg: string }> = {
  amazon:   { label: 'Amazon',   paramLabel: 'Associate Tag',  hint: 'e.g. mystore-21',      color: '#F59E0B', bg: '#FEF3C7' },
  flipkart: { label: 'Flipkart', paramLabel: 'Affiliate ID',   hint: 'e.g. myflipkartid',    color: '#2563EB', bg: '#DBEAFE' },
  meesho:   { label: 'Meesho',   paramLabel: 'Referral Code',  hint: 'e.g. MYCODE',           color: '#7C3AED', bg: '#EDE9FE' },
  myntra:   { label: 'Myntra',   paramLabel: 'UTM Source Tag', hint: 'e.g. mymyntrapartner',  color: '#EC4899', bg: '#FCE7F3' },
};

export function detectPlatform(url: string): AffiliatePlatform | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('amazon.'))   return 'amazon';
    if (host.includes('amzn.'))     return 'amazon';   // amzn.to short links
    if (host.includes('flipkart.')) return 'flipkart';
    if (host.includes('meesho.'))   return 'meesho';
    if (host.includes('myntra.'))   return 'myntra';
    return null;
  } catch {
    return null;
  }
}

export function buildAffiliateUrl(
  originalUrl: string,
  platform: AffiliatePlatform,
  affiliateTag: string,
): string {
  if (!affiliateTag.trim()) return originalUrl;
  // amzn.to short links can't have params appended meaningfully — leave as-is
  try {
    const host = new URL(originalUrl).hostname.replace(/^www\./, '');
    if (host.includes('amzn.')) return originalUrl;
  } catch {
    return originalUrl;
  }
  try {
    const u = new URL(originalUrl);
    u.searchParams.set(PARAM_MAP[platform], affiliateTag.trim());
    return u.toString();
  } catch {
    return originalUrl;
  }
}

export async function fetchAffiliateSettings(): Promise<Map<AffiliatePlatform, string>> {
  const { data } = await supabase
    .from('affiliate_settings')
    .select('platform, affiliate_tag')
    .eq('is_active', true);

  const map = new Map<AffiliatePlatform, string>();
  (data ?? []).forEach((row: any) => {
    if (row.affiliate_tag?.trim()) {
      map.set(row.platform as AffiliatePlatform, row.affiliate_tag.trim());
    }
  });
  return map;
}

export function autoAffiliate(
  productUrl: string,
  settingsMap: Map<AffiliatePlatform, string>,
): { affiliateUrl: string | null; platform: AffiliatePlatform | null } {
  const platform = detectPlatform(productUrl);
  if (!platform) return { affiliateUrl: null, platform: null };
  const tag = settingsMap.get(platform);
  if (!tag) return { affiliateUrl: null, platform };
  return { affiliateUrl: buildAffiliateUrl(productUrl, platform, tag), platform };
}
