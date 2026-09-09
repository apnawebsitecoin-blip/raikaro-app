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

  // Verify caller is an admin
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { title, body, data, target_user_ids } = await req.json();

  if (!title || !body) {
    return new Response(JSON.stringify({ error: 'title and body are required' }), { status: 400 });
  }

  // Fetch push tokens (all users, or a specific subset)
  let query = supabase.from('profiles').select('push_token').not('push_token', 'is', null);
  if (target_user_ids?.length) {
    query = query.in('id', target_user_ids);
  }
  const { data: profiles } = await query;
  const tokens: string[] = (profiles ?? []).map((p: any) => p.push_token).filter(Boolean);

  if (tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No registered tokens found' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Expo push API accepts up to 100 messages per request
  let totalSent = 0;
  for (let i = 0; i < tokens.length; i += 100) {
    const chunk = tokens.slice(i, i + 100);
    const messages = chunk.map((token: string) => ({
      to: token,
      title,
      body,
      data: data ?? {},
      sound: 'default',
      priority: 'high',
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (res.ok) totalSent += chunk.length;
  }

  return new Response(JSON.stringify({ sent: totalSent }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
