-- Add waiting_payment status to table_status enum
ALTER TYPE table_status ADD VALUE 'waiting_payment';

-- Create insumos (stock/ingredients) table
CREATE TABLE public.insumos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  unidade_de_medida TEXT NOT NULL,
  quantidade_atual NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on insumos
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;

-- Admins can manage insumos
CREATE POLICY "Admins can manage insumos"
ON public.insumos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Kitchen and waiters can view insumos
CREATE POLICY "Kitchen and waiters can view insumos"
ON public.insumos
FOR SELECT
USING (
  has_role(auth.uid(), 'kitchen'::app_role) OR 
  has_role(auth.uid(), 'waiter'::app_role)
);

-- Add recipe field to menu_items (stores array of {insumo_id, quantidade})
ALTER TABLE public.menu_items 
ADD COLUMN recipe JSONB DEFAULT '[]'::jsonb;

-- Create function to deduct stock when order is completed
CREATE OR REPLACE FUNCTION public.deduct_stock_for_order(order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record RECORD;
  recipe_item JSONB;
  insumo_id_val UUID;
  quantidade_val NUMERIC;
BEGIN
  -- Get order details
  SELECT o.quantity, m.recipe
  INTO order_record
  FROM orders o
  JOIN menu_items m ON m.id = o.menu_item_id
  WHERE o.id = order_id;

  -- Loop through each ingredient in the recipe
  FOR recipe_item IN SELECT * FROM jsonb_array_elements(order_record.recipe)
  LOOP
    insumo_id_val := (recipe_item->>'insumo_id')::UUID;
    quantidade_val := (recipe_item->>'quantidade')::NUMERIC;
    
    -- Deduct stock
    UPDATE insumos
    SET quantidade_atual = quantidade_atual - (quantidade_val * order_record.quantity)
    WHERE id = insumo_id_val;
  END LOOP;
END;
$$;