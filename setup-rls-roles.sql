-- 1. Create admin_roles table if not exists
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role = 'admin'),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- 2. Insert exactly one admin
INSERT INTO public.admin_roles (user_id, role)
VALUES ('a5958a06-c8d3-407a-9b76-1f9670635a92', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 3. Secure admin_roles with RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin roles are readable by the user" ON public.admin_roles;
CREATE POLICY "Admin roles are readable by the user"
ON public.admin_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Removed infinite recursion policy

-- No one can insert/update/delete via API, only via service_role/sql editor

-- 4. Secure Customers (Profiles) Table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id text,
  name text,
  email text,
  mobile text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can read own profile" ON public.customers;
CREATE POLICY "Customers can read own profile"
ON public.customers FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
CREATE POLICY "Customers can update own profile"
ON public.customers FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Customers can insert own profile" ON public.customers;
CREATE POLICY "Customers can insert own profile"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can do everything on customers" ON public.customers;
CREATE POLICY "Admins can do everything on customers"
ON public.customers FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 5. Secure Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text,
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  payment_gateway text,
  payment_transaction_id text,
  total numeric,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can read own orders" ON public.orders;
CREATE POLICY "Customers can read own orders"
ON public.orders FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can insert own orders" ON public.orders;
CREATE POLICY "Customers can insert own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can do everything on orders" ON public.orders;
CREATE POLICY "Admins can do everything on orders"
ON public.orders FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 5.1 Secure Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid,
  quantity integer,
  price numeric
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can read own order items" ON public.order_items;
CREATE POLICY "Customers can read own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE public.orders.id = public.order_items.order_id 
    AND public.orders.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can insert own order items" ON public.order_items;
CREATE POLICY "Customers can insert own order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE public.orders.id = public.order_items.order_id 
    AND public.orders.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can do everything on order items" ON public.order_items;
CREATE POLICY "Admins can do everything on order items"
ON public.order_items FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'));


-- 6. Saved Payment Methods (Tokenization references for cards/UPI)
CREATE TABLE IF NOT EXISTS public.saved_payment_methods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway text NOT NULL, -- e.g., 'razorpay', 'cashfree'
  type text NOT NULL, -- e.g., 'card', 'upi'
  gateway_reference_id text NOT NULL, -- Token ID from gateway
  display_info text, -- Masked info like '•••• 1234' or 'name@upi'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can read own payment methods" ON public.saved_payment_methods;
CREATE POLICY "Customers can read own payment methods"
ON public.saved_payment_methods FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can manage own payment methods" ON public.saved_payment_methods;
CREATE POLICY "Customers can manage own payment methods"
ON public.saved_payment_methods FOR ALL
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- 7. Products and Configuration (Admin modifications only, Public read)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  mrp numeric,
  selling_price numeric,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Payment Config
CREATE TABLE IF NOT EXISTS public.payment_config (
  gateway text PRIMARY KEY,
  enabled boolean DEFAULT false,
  environment text DEFAULT 'test',
  public_key text,
  secret_key text
);

ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read limited config" ON public.payment_config;
-- Note: It is safer to use a backend endpoint for this, but if doing RLS, restrict columns or rows.
-- In our edge function, we fetch it securely, but if clients do it:
CREATE POLICY "Public can read config"
ON public.payment_config FOR SELECT TO public USING (true);
-- To restrict columns, supabase uses column-level privileges, but for now we rely on the edge function for secure secrets.

DROP POLICY IF EXISTS "Admins can manage payment config" ON public.payment_config;
CREATE POLICY "Admins can manage payment config"
ON public.payment_config FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Promo Codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  discount_type text,
  discount_value numeric,
  max_discount_amount numeric,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active promo codes" ON public.promo_codes;
CREATE POLICY "Public can read active promo codes"
ON public.promo_codes FOR SELECT TO public USING (active = true);

DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Remove any rogue admin roles just in case
DELETE FROM public.admin_roles WHERE user_id != 'a5958a06-c8d3-407a-9b76-1f9670635a92';
