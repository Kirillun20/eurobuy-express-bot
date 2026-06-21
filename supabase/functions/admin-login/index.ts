import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = 'admin@eurobuy.local';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { password } = await req.json().catch(() => ({}));
    const expected = Deno.env.get('ADMIN_PASSWORD');
    if (!expected) {
      return new Response(JSON.stringify({ error: 'server_not_configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (typeof password !== 'string' || password !== expected) {
      return new Response(JSON.stringify({ error: 'invalid_password' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // Ensure admin auth user exists with the same password as ADMIN_PASSWORD
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let adminUser = list?.users?.find((u) => u.email === ADMIN_EMAIL) ?? null;

    if (!adminUser) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: expected,
        email_confirm: true,
        user_metadata: { name: 'Администратор' },
      });
      if (createErr || !created.user) throw createErr ?? new Error('create_failed');
      adminUser = created.user;
    } else {
      // Keep auth password in sync with the secret
      await admin.auth.admin.updateUserById(adminUser.id, { password: expected });
    }

    // Ensure admin role
    await admin.from('user_roles').upsert(
      { user_id: adminUser.id, role: 'admin' },
      { onConflict: 'user_id,role' },
    );

    // Sign in with anon client to receive session tokens
    const anon = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: expected,
    });
    if (signInErr || !signIn.session) throw signInErr ?? new Error('signin_failed');

    return new Response(
      JSON.stringify({
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
