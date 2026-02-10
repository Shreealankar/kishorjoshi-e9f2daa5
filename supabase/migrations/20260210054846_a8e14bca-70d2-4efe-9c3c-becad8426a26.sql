
-- Enable pgcrypto in extensions schema (default location)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Recreate functions to use extensions schema for crypt/gen_salt
CREATE OR REPLACE FUNCTION public.create_member(_name text, _password text, _role app_role DEFAULT 'member'::app_role)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.members (name, password_hash)
  VALUES (_name, extensions.crypt(_password, extensions.gen_salt('bf')))
  RETURNING id INTO new_id;
  
  INSERT INTO public.user_roles (member_id, role)
  VALUES (new_id, _role);
  
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_member_login(_name text, _password text)
RETURNS TABLE(member_id uuid, member_name text, member_role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.name, ur.role
  FROM public.members m
  JOIN public.user_roles ur ON ur.member_id = m.id
  WHERE m.name = _name AND m.password_hash = extensions.crypt(_password, m.password_hash);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_member_password(_member_id uuid, _new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE public.members SET password_hash = extensions.crypt(_new_password, extensions.gen_salt('bf')), updated_at = now()
  WHERE id = _member_id;
END;
$$;
