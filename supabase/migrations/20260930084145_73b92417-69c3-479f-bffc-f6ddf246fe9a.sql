ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location_type text NOT NULL DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS visible_in_store boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS online_booking boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS store_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS store_tagline text;

CREATE TABLE public.catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'service',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_categories TO authenticated;
GRANT ALL ON public.catalog_categories TO service_role;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage categories" ON public.catalog_categories FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

ALTER TABLE public.services ADD CONSTRAINT services_category_fk FOREIGN KEY (category_id) REFERENCES public.catalog_categories(id) ON DELETE SET NULL;

CREATE TABLE public.service_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_pence integer NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 60,
  position integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_variants TO authenticated;
GRANT ALL ON public.service_variants TO service_role;
ALTER TABLE public.service_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage variants" ON public.service_variants FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

CREATE TABLE public.service_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_pence integer NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_addons TO authenticated;
GRANT ALL ON public.service_addons TO service_role;
ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage addons" ON public.service_addons FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

CREATE TABLE public.service_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  label text NOT NULL,
  type text NOT NULL DEFAULT 'short_text',
  options text[] NOT NULL DEFAULT '{}',
  required boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_questions TO authenticated;
GRANT ALL ON public.service_questions TO service_role;
ALTER TABLE public.service_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage questions" ON public.service_questions FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price_pence integer NOT NULL DEFAULT 0,
  compare_at_pence integer,
  sku text,
  stock integer,
  image_urls text[] NOT NULL DEFAULT '{}',
  fulfilment text NOT NULL DEFAULT 'reserve',
  visible_in_store boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage products" ON public.products FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  kind text NOT NULL DEFAULT 'reserve',
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reservations TO authenticated;
GRANT ALL ON public.product_reservations TO service_role;
ALTER TABLE public.product_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage reservations" ON public.product_reservations FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

CREATE OR REPLACE FUNCTION public.public_store(_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'workspace', jsonb_build_object('id', w.id, 'name', w.name, 'slug', w.slug, 'logo_url', w.logo_url, 'tagline', w.store_tagline,
       'address', bs.address, 'phone', bs.phone),
    'categories', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'kind', c.kind) ORDER BY c.position, c.name) FROM catalog_categories c WHERE c.workspace_id = w.id), '[]'::jsonb),
    'services', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'description', s.description, 'price_pence', s.price_pence,
        'duration_minutes', s.duration_minutes, 'deposit_pence', s.deposit_pence, 'category_id', s.category_id, 'location_type', s.location_type,
        'image_urls', s.image_urls,
        'variants', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', v.name, 'price_pence', v.price_pence, 'duration_minutes', v.duration_minutes) ORDER BY v.position) FROM service_variants v WHERE v.service_id = s.id), '[]'::jsonb),
        'addons', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', a.name, 'price_pence', a.price_pence) ORDER BY a.position) FROM service_addons a WHERE a.service_id = s.id), '[]'::jsonb)
      ) ORDER BY s.position, s.name) FROM services s WHERE s.workspace_id = w.id AND s.active AND s.visible_in_store AND NOT s.archived), '[]'::jsonb),
    'products', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'description', p.description, 'price_pence', p.price_pence,
        'compare_at_pence', p.compare_at_pence, 'image_urls', p.image_urls, 'fulfilment', p.fulfilment, 'category_id', p.category_id,
        'in_stock', (p.stock IS NULL OR p.stock > 0)) ORDER BY p.position, p.name)
      FROM products p WHERE p.workspace_id = w.id AND p.active AND p.visible_in_store), '[]'::jsonb)
  )
  FROM workspaces w LEFT JOIN business_settings bs ON bs.workspace_id = w.id
  WHERE w.slug = _slug AND w.store_enabled AND w.onboarded_at IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.public_store(text) TO anon, authenticated;