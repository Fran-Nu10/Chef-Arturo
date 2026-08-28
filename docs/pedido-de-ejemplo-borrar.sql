-- ============================================================================
-- Borra el pedido de ejemplo y su cliente de muestra.
--
-- Las líneas del pedido se van solas (`on delete cascade`), y con ellas
-- desaparece la marca que impide borrar un producto ya vendido: después de
-- esto los productos del ejemplo vuelven a ser borrables.
-- ============================================================================

delete from public.orders where internal_notes like 'PEDIDO DE EJEMPLO%';
delete from public.customers where internal_notes like 'PEDIDO DE EJEMPLO%';
