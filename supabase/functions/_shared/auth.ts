// Shared admin-auth helper for protected edge functions.
// Validates a Bearer JWT and confirms the user has the 'admin' role.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function requireAdmin(req: Request): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: Response }
> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      }),
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const token = authHeader.replace('Bearer ', '')

  // Trusted server-to-server calls between our own functions use the service role JWT
  if (token === serviceKey) {
    return { ok: true, userId: 'service-role' }
  }

  // Verify the user
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
  if (claimsErr || !claimsData?.claims?.sub) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      }),
    }
  }

  const userId = claimsData.claims.sub as string

  // Check admin role using service-role client (bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceKey)
  const { data: roles, error: rolesErr } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .limit(1)

  if (rolesErr || !roles?.length) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
        status: 403,
        headers: corsHeaders,
      }),
    }
  }

  return { ok: true, userId }
}
