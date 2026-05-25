-- Set role for an existing Supabase Auth user.
-- Create the Auth user first (Dashboard -> Authentication -> Users).

DO $$
DECLARE
  target_email TEXT := 'nirajpatil0605@gmail.com';
  target_role TEXT := 'admin';
  target_name TEXT := 'Phoenix';
  user_id UUID;
BEGIN
  IF target_role NOT IN ('owner', 'admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role: %', target_role;
  END IF;

  SELECT id INTO user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(target_email)
  LIMIT 1;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found for email %', target_email;
  END IF;

  UPDATE public.profiles
  SET role = target_role,
      full_name = COALESCE(full_name, target_name),
      is_active = true
  WHERE id = user_id;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (user_id, target_name, target_role, true);
  END IF;

  RAISE NOTICE 'Updated role for % (id=%) to %', target_email, user_id, target_role;
END $$;
