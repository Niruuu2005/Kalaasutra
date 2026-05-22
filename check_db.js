import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('categories').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! Categories table exists.", data);
  }
}

check();
