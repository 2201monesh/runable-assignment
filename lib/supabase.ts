// Run this once in Supabase SQL editor:
// create table components (
//   id uuid default gen_random_uuid() primary key,
//   code text not null,
//   created_at timestamp with time zone default now(),
//   updated_at timestamp with time zone default now()
// );

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
