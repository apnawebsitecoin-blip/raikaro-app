import { supabase } from './supabase';

export type ClickSource = 'product_detail' | 'home_featured' | 'deals_card';

export async function logProductClick(
  userId: string | undefined,
  productId: string,
  source: ClickSource,
): Promise<void> {
  await supabase.from('product_clicks').insert({
    user_id: userId ?? null,
    product_id: productId,
    source,
  });
}
