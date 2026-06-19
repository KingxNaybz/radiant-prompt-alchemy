
-- 1) Remove privilege escalation policy
DROP POLICY IF EXISTS "User can claim owner if none exists" ON public.user_roles;

-- 2) Restrict anon column access on paintings to non-sensitive storefront fields
REVOKE SELECT ON public.paintings FROM anon;
GRANT SELECT (
  id, title, description, image_url, aspect_ratio, price_cents,
  category_id, tags, room_mockups, is_published, status, created_at, updated_at
) ON public.paintings TO anon;

-- 3) Tighten always-true insert policies with minimal validation
DROP POLICY IF EXISTS "Anyone can submit commission requests" ON public.commissions;
CREATE POLICY "Anyone can submit commission requests"
  ON public.commissions FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) > 0
    AND length(btrim(email)) > 3
    AND email LIKE '%_@_%.__%'
    AND length(btrim(vision)) > 0
  );

DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order"
  ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(customer_name)) > 0
    AND length(btrim(customer_email)) > 3
    AND customer_email LIKE '%_@_%.__%'
    AND length(btrim(painting_title)) > 0
    AND length(btrim(shipping_address)) > 0
    AND amount_cents > 0
  );

-- 4) Lock down SECURITY DEFINER email queue helpers + pin search_path
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
