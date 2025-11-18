-- Fix orders table RLS: Replace permissive policy with unit-scoped policies

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;

-- Kitchen staff can only view orders for their unit
CREATE POLICY "Kitchen can view unit orders" ON public.orders
  FOR SELECT 
  USING (
    has_role(auth.uid(), 'kitchen'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.tables t ON t.id = orders.table_id
      JOIN public.profiles waiter ON waiter.id = t.waiter_id
      WHERE p.id = auth.uid() AND p.unit_id = waiter.unit_id
    )
  );

-- Waiters can only view their own orders
CREATE POLICY "Waiters can view own orders" ON public.orders
  FOR SELECT 
  USING (
    has_role(auth.uid(), 'waiter'::app_role) AND
    waiter_id = auth.uid()
  );

-- Admins can only view orders from their unit
CREATE POLICY "Admins can view unit orders" ON public.orders
  FOR SELECT 
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.tables t ON t.id = orders.table_id
      JOIN public.profiles waiter ON waiter.id = t.waiter_id
      WHERE p.id = auth.uid() AND p.unit_id = waiter.unit_id
    )
  );