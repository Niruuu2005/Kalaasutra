const { createClient } = require('@supabase/supabase-js');

try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  // dotenv is optional; environment variables can be set by the shell.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const args = process.argv.slice(2);
const readArg = (name) => {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return null;
  return args[index + 1] || null;
};

const email = process.env.ADMIN_EMAIL || readArg('email');
const password = process.env.ADMIN_PASSWORD || readArg('password');
const fullName = process.env.ADMIN_FULL_NAME || readArg('name');
const roleInput = process.env.ADMIN_ROLE || readArg('role') || 'admin';
const role = roleInput.toLowerCase();
const allowedRoles = new Set(['owner', 'admin', 'user']);

if (!allowedRoles.has(role)) {
  console.error('ADMIN_ROLE must be one of: owner, admin, user.');
  process.exit(1);
}

if (!email) {
  console.error('ADMIN_EMAIL (or --email) is required.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const findUserByEmail = async (targetEmail) => {
  let page = 1;
  const perPage = 1000;
  const normalized = targetEmail.toLowerCase();

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users || [];
    const match = users.find((user) => (user.email || '').toLowerCase() === normalized);
    if (match) return match;

    if (users.length < perPage) return null;
    page += 1;
  }
};

const createUser = async () => {
  if (!password) {
    throw new Error('ADMIN_PASSWORD (or --password) is required to create a new user.');
  }

  const payload = {
    email,
    password,
    email_confirm: true
  };

  if (fullName) {
    payload.user_metadata = { full_name: fullName };
  }

  const { data, error } = await supabase.auth.admin.createUser(payload);
  if (error) throw error;
  return data.user;
};

const ensureUser = async () => {
  const existing = await findUserByEmail(email);
  if (existing) return existing;
  return createUser();
};

const setProfileRole = async (userId) => {
  const updatePayload = { role };
  if (fullName) updatePayload.full_name = fullName;

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select('id, role, full_name');

  if (error) throw error;

  if (data && data.length > 0) {
    return data[0];
  }

  const insertPayload = {
    id: userId,
    role,
    is_active: true
  };

  if (fullName) insertPayload.full_name = fullName;

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert(insertPayload)
    .select('id, role, full_name');

  if (insertError) throw insertError;
  return inserted?.[0] || null;
};

const main = async () => {
  const user = await ensureUser();
  const profile = await setProfileRole(user.id);

  console.log('User ID:', user.id);
  console.log('Email:', user.email || email);
  console.log('Role:', profile?.role || role);
  if (fullName) {
    console.log('Full name:', profile?.full_name || fullName);
  }
};

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
