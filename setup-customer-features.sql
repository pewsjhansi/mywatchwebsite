-- Customer Addresses
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, -- e.g., HOME, OFFICE
  full_name text NOT NULL,
  mobile text NOT NULL,
  street_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pin_code text NOT NULL,
  country text DEFAULT 'India',
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can manage own addresses"
ON public.customer_addresses FOR ALL
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Wishlist
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(customer_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can manage own wishlist" ON public.wishlists;
CREATE POLICY "Customers can manage own wishlist"
ON public.wishlists FOR ALL
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Saved Watches
CREATE TABLE IF NOT EXISTS public.saved_watches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(customer_id, product_id)
);

ALTER TABLE public.saved_watches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can manage own saved watches" ON public.saved_watches;
CREATE POLICY "Customers can manage own saved watches"
ON public.saved_watches FOR ALL
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Make sure admin can see these if needed for support, though strict isolation is requested.
-- "Admin may access customer/order information only as required for legitimate existing admin functions."
-- We will restrict addresses/wishlists to customer only for maximum isolation.
