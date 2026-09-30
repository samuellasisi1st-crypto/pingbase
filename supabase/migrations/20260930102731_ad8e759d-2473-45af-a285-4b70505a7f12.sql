CREATE OR REPLACE FUNCTION public.site_data(_workspace_id uuid)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'workspace', jsonb_build_object('id', w.id, 'name', w.name, 'slug', w.slug, 'logo_url', w.logo_url, 'tagline', w.store_tagline,
       'address', bs.address, 'phone', bs.phone, 'email', bs.email, 'opening_hours', bs.opening_hours),
    'site', (SELECT to_jsonb(wc) - 'workspace_id' - 'created_at' - 'updated_at' FROM website_configs wc WHERE wc.workspace_id = w.id),
    'team', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', st.name, 'role', st.role_title) ORDER BY st.created_at) FROM staff st WHERE st.workspace_id = w.id AND st.active), '[]'::jsonb),
    'categories', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'kind', c.kind) ORDER BY c.position, c.name) FROM catalog_categories c WHERE c.workspace_id = w.id), '[]'::jsonb),
    'services', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'description', s.description, 'price_pence', s.price_pence,
        'duration_minutes', s.duration_minutes, 'deposit_pence', s.deposit_pence, 'category_id', s.category_id, 'location_type', s.location_type,
        'image_urls', s.image_urls, 'online_booking', s.online_booking, 'payment_mode', s.payment_mode,
        'variants', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', v.name, 'price_pence', v.price_pence, 'duration_minutes', v.duration_minutes) ORDER BY v.position) FROM service_variants v WHERE v.service_id = s.id), '[]'::jsonb),
        'addons', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', a.name, 'price_pence', a.price_pence) ORDER BY a.position) FROM service_addons a WHERE a.service_id = s.id), '[]'::jsonb)
      ) ORDER BY s.position, s.name) FROM services s WHERE s.workspace_id = w.id AND s.active AND s.visible_in_store AND NOT s.archived), '[]'::jsonb),
    'products', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'description', p.description, 'price_pence', p.price_pence,
        'compare_at_pence', p.compare_at_pence, 'image_urls', p.image_urls, 'fulfilment', p.fulfilment, 'category_id', p.category_id,
        'in_stock', (p.stock IS NULL OR p.stock > 0)) ORDER BY p.position, p.name)
      FROM products p WHERE p.workspace_id = w.id AND p.active AND p.visible_in_store), '[]'::jsonb)
  )
  FROM workspaces w LEFT JOIN business_settings bs ON bs.workspace_id = w.id
  WHERE w.id = _workspace_id
$function$;
REVOKE EXECUTE ON FUNCTION public.site_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.site_data(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.public_store(_slug text)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT public.site_data(w.id) FROM workspaces w
  WHERE w.slug = _slug AND w.store_enabled AND w.onboarded_at IS NOT NULL
$function$;