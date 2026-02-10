
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Members table (custom auth - no email, just name + password)
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from members as required)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  UNIQUE(member_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category_id UUID REFERENCES public.categories(id),
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create a view to hide password_hash from members table
CREATE VIEW public.members_public
WITH (security_invoker = on) AS
  SELECT id, name, created_at, updated_at
  FROM public.members;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.get_member_role(_member_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE member_id = _member_id LIMIT 1
$$;

-- Security definer function to verify password (for login)
CREATE OR REPLACE FUNCTION public.verify_member_login(_name TEXT, _password TEXT)
RETURNS TABLE(member_id UUID, member_name TEXT, member_role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.name, ur.role
  FROM public.members m
  JOIN public.user_roles ur ON ur.member_id = m.id
  WHERE m.name = _name AND m.password_hash = crypt(_password, m.password_hash);
END;
$$;

-- Security definer function to create member (admin only)
CREATE OR REPLACE FUNCTION public.create_member(_name TEXT, _password TEXT, _role app_role DEFAULT 'member')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.members (name, password_hash)
  VALUES (_name, crypt(_password, gen_salt('bf')))
  RETURNING id INTO new_id;
  
  INSERT INTO public.user_roles (member_id, role)
  VALUES (new_id, _role);
  
  RETURN new_id;
END;
$$;

-- Security definer function to update member password
CREATE OR REPLACE FUNCTION public.update_member_password(_member_id UUID, _new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.members SET password_hash = crypt(_new_password, gen_salt('bf')), updated_at = now()
  WHERE id = _member_id;
END;
$$;

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- RLS Policies for members (no direct SELECT to hide password_hash)
CREATE POLICY "No direct access to members" ON public.members FOR SELECT USING (false);
CREATE POLICY "No direct insert to members" ON public.members FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update to members" ON public.members FOR UPDATE USING (false);
CREATE POLICY "No direct delete to members" ON public.members FOR DELETE USING (false);

-- RLS for user_roles - deny direct access, use security definer functions
CREATE POLICY "No direct access to user_roles" ON public.user_roles FOR SELECT USING (false);

-- RLS for categories - everyone can read
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "No direct insert categories" ON public.categories FOR INSERT WITH CHECK (false);

-- RLS for transactions - deny direct access, will use edge functions
CREATE POLICY "Anyone can read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete transactions" ON public.transactions FOR DELETE USING (true);

-- Insert default Marathi categories
INSERT INTO public.categories (name) VALUES
  ('भाजीपाला'),
  ('किराणा'),
  ('बिल'),
  ('वैद्यकीय'),
  ('शिक्षण'),
  ('प्रवास'),
  ('कपडे'),
  ('घरभाडे'),
  ('पगार'),
  ('व्याज'),
  ('इतर');

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Delete member function (admin only)
CREATE OR REPLACE FUNCTION public.delete_member(_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.members WHERE id = _member_id;
END;
$$;

-- Get all members (for admin)
CREATE OR REPLACE FUNCTION public.get_all_members()
RETURNS TABLE(id UUID, name TEXT, role app_role, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.name, ur.role, m.created_at
  FROM public.members m
  JOIN public.user_roles ur ON ur.member_id = m.id
  ORDER BY m.created_at;
$$;
