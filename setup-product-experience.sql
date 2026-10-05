-- 1. Modify products table for warranty and video
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS warranty_available boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS warranty_duration text,
ADD COLUMN IF NOT EXISTS warranty_type text,
ADD COLUMN IF NOT EXISTS warranty_terms text,
ADD COLUMN IF NOT EXISTS video_url text;

-- 2. Create product_images table
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL,
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_images" ON public.product_images;
CREATE POLICY "Public read product_images" ON public.product_images FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins manage product_images" ON public.product_images;
CREATE POLICY "Admins manage product_images" ON public.product_images FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 3. Create product_specifications table
CREATE TABLE IF NOT EXISTS public.product_specifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL,
  spec_name text NOT NULL,
  spec_value text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_specifications" ON public.product_specifications;
CREATE POLICY "Public read product_specifications" ON public.product_specifications FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins manage product_specifications" ON public.product_specifications;
CREATE POLICY "Admins manage product_specifications" ON public.product_specifications FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 4. Create product_recommendations table
CREATE TABLE IF NOT EXISTS public.product_recommendations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL,
  recommended_product_id text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, recommended_product_id)
);

ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product_recommendations" ON public.product_recommendations;
CREATE POLICY "Public read product_recommendations" ON public.product_recommendations FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins manage product_recommendations" ON public.product_recommendations;
CREATE POLICY "Admins manage product_recommendations" ON public.product_recommendations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 5. Create recently_viewed_products table
CREATE TABLE IF NOT EXISTS public.recently_viewed_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(customer_id, product_id)
);

ALTER TABLE public.recently_viewed_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers read own recently_viewed_products" ON public.recently_viewed_products;
CREATE POLICY "Customers read own recently_viewed_products" ON public.recently_viewed_products FOR SELECT TO authenticated USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Customers manage own recently_viewed_products" ON public.recently_viewed_products;
CREATE POLICY "Customers manage own recently_viewed_products" ON public.recently_viewed_products FOR ALL TO authenticated USING (auth.uid() = customer_id);
