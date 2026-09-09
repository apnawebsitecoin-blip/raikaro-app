import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!callerProfile?.is_admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { product_id, new_price } = await req.json();
  if (!product_id || new_price == null) {
    return new Response(JSON.stringify({ error: 'product_id and new_price are required' }), { status: 400 });
  }

  // Find all untriggered alerts for this product where price target is now met
  const { data: alerts } = await supabase
    .from('price_alerts')
    .select('id, user_id')
    .eq('product_id', product_id)
    .gte('target_price', new_price)
    .is('triggered_at', null);

  if (!alerts || alerts.length === 0) {
    return new Response(JSON.stringify({ triggered: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const alertIds = alerts.map((a: any) => a.id);
  const userIds = alerts.map((a: any) => a.user_id);

  // Get the product name for the notification text
  const { data: product } = await supabase
    .from('products')
    .select('name')
    .eq('id', product_id)
    .single();
  const productName = product?.name ?? 'A product';

  // Get push tokens for affected users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token')
    .in('id', userIds)
    .not('push_token', 'is', null);

  // Mark alerts as triggered
  await supabase
    .from('price_alerts')
    .update({ triggered_at: new Date().toISOString() })
    .in('id', alertIds);

  // Insert in-app notifications for each affected user
  const notifRows = userIds.map((uid: string) => ({
    user_id: uid,
    message: `Price drop! ${productName} is now ₹${new_price} — your target price has been met.`,
    read: false,
  }));
  await supabase.from('notifications').insert(notifRows);

  // Send push notifications
  const tokens: string[] = (profiles ?? []).map((p: any) => p.push_token).filter(Boolean);
  let sent = 0;

  if (tokens.length > 0) {
    for (let i = 0; i < tokens.length; i += 100) {
      const chunk = tokens.slice(i, i + 100);
      const messages = chunk.map((token: string) => ({
        to: token,
        title: 'Price Drop Alert 🔔',
        body: `${productName} is now ₹${new_price.toLocaleString('en-IN')} — your target price has been met!`,
        data: { screen: 'ProductDetail', product_id },
        sound: 'default',
        priority: 'high',
      }));

      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(messages),
      });

      if (res.ok) sent += chunk.length;
    }
  }

  return new Response(JSON.stringify({ triggered: alerts.length, push_sent: sent }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
