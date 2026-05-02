// Run this once in Supabase SQL editor:
// create table components (
//   id uuid default gen_random_uuid() primary key,
//   code text not null,
//   created_at timestamp with time zone default now(),
//   updated_at timestamp with time zone default now()
// );

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings, then redeploy.'
    )
  }
  _client = createClient(url, key)
  return _client
}
