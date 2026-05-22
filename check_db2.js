import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
  try {
    const res = await fetch(`${url}/rest/v1/categories?select=*&limit=1`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Data:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}
check();
