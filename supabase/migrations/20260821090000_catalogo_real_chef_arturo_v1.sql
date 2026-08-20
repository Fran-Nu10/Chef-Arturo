-- ============================================================================
-- 0009 · Catálogo real de Chef Arturo (V1)
--
-- Carga las categorías y los 37 productos del material oficial de Julia
-- (capturas de difusión / catálogo comercial), transcriptos en
-- docs/CATALOGO_REAL_V1.md. Nada de lo que hay acá se inventó: cada precio,
-- descripción y regla de negocio sale de esa fuente o de una decisión de
-- modelado explícita, documentada en el mismo archivo.
--
-- Idempotente por diseño: cada bloque hace `insert ... on conflict (slug) do
-- update`, así que correr esta migración una segunda vez no duplica nada y no
-- cambia ningún `id` existente. Puede ejecutarse tantas veces como haga falta.
--
-- No toca RLS, autenticación, pedidos, Mercado Pago ni ninguna función crítica:
-- sólo agrega filas en `categories` y `products` usando las columnas que ya
-- definían las migraciones 0002 y siguientes.
-- ============================================================================

-- ── Categorías ───────────────────────────────────────────────────────────────
insert into public.categories (slug, name, description, position, is_active)
values
  ('pasteleria', 'Pastelería', '', 10, true),
  ('merienda', 'Merienda', 'Cookies, brownies y boxes dulces.', 20, true),
  ('salados', 'Salados', 'Empanadas, tartas y preparaciones de hojaldre.', 30, true),
  ('lunch-para-eventos', 'Lunch para eventos', 'Propuestas para reuniones, celebraciones y eventos.', 40, true)

on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      position    = excluded.position,
      is_active   = true;
-- `is_active = true` a secas (no `excluded.is_active`): si una categoría ya
-- existía desactivada, esta carga la reactiva porque la está poblando con
-- productos reales. El resto de los campos sí toma el valor de `excluded`
-- para poder corregir texto en una reejecución futura.

-- ── Productos ────────────────────────────────────────────────────────────────
-- Precios en centésimos (`price_cents`), moneda UYU (fijada por el CHECK de
-- la tabla). `track_stock = false` en todos: no hay cantidades reales que
-- controlar. `min_quantity` y `low_stock_threshold` quedan en su default (1 y
-- 0): la fuente no informa mínimos de compra ni umbrales de stock bajo.
insert into public.products (
  slug, name, category_id, short_description, full_description,
  price_cents, status, sale_mode, is_featured, position,
  track_stock, lead_time_days, fulfillment
)
select
  v.slug, v.name, c.id, v.short_description, v.full_description,
  v.price_cents, 'active'::public.product_status, v.sale_mode::public.sale_mode, false, v.position,
  false, v.lead_time_days, 'both'::public.fulfillment_mode
from (
  values
    ('cheesecake-clasica-individual', 'Cheesecake clásica — individual', 'pasteleria', 'Sabrosa tarta de queso y frutos rojos, una de las favoritas.', 'Sabrosa tarta de queso y frutos rojos, una de las favoritas. Presentación individual.', 24000, 'direct', 0, 10),
    ('cheesecake-clasica-entero-kg', 'Cheesecake clásica — entero por kg', 'pasteleria', 'Sabrosa tarta de queso y frutos rojos, una de las favoritas.', 'Sabrosa tarta de queso y frutos rojos, una de las favoritas. El precio de $990 corresponde a un kilogramo; el peso final de la torta entera puede variar según el tamaño solicitado. Se encarga con 24 horas de anticipación.', 99000, 'preorder', 1, 20),
    ('mousse-dulce-de-leche-frutos-rojos-individual', 'Mousse de dulce de leche y frutos rojos — individual', 'pasteleria', 'Suave mousse de dulce de leche y frutos rojos, una combinación perfecta.', 'Suave mousse de dulce de leche y frutos rojos, una combinación perfecta. Presentación individual.', 24000, 'direct', 0, 30),
    ('mousse-dulce-de-leche-frutos-rojos-entero-kg', 'Mousse de dulce de leche y frutos rojos — entero por kg', 'pasteleria', 'Suave mousse de dulce de leche y frutos rojos, una combinación perfecta.', 'Suave mousse de dulce de leche y frutos rojos, una combinación perfecta. El precio de $990 corresponde a un kilogramo; el peso final de la torta entera puede variar según el tamaño solicitado. Se encarga con 24 horas de anticipación.', 99000, 'preorder', 1, 40),
    ('cheesecake-maracuya-individual', 'Cheesecake de maracuyá — individual', 'pasteleria', 'Tarta de queso y maracuyá, fresca e irresistible.', 'Tarta de queso y maracuyá, fresca e irresistible. Presentación individual.', 24000, 'direct', 0, 50),
    ('cheesecake-maracuya-entero-kg', 'Cheesecake de maracuyá — entero por kg', 'pasteleria', 'Tarta de queso y maracuyá, fresca e irresistible.', 'Tarta de queso y maracuyá, fresca e irresistible. El precio de $990 corresponde a un kilogramo; el peso final de la torta entera puede variar según el tamaño solicitado. Se encarga con 24 horas de anticipación.', 99000, 'preorder', 1, 60),
    ('lemon-pie-individual', 'Lemon pie — individual', 'pasteleria', 'Clásico postre dulce y ácido que nunca pasa de moda.', 'Clásico postre dulce y ácido que nunca pasa de moda. Presentación individual.', 24000, 'direct', 0, 70),
    ('lemon-pie-entero-kg', 'Lemon pie — entero por kg', 'pasteleria', 'Clásico postre dulce y ácido que nunca pasa de moda.', 'Clásico postre dulce y ácido que nunca pasa de moda. El precio de $990 corresponde a un kilogramo; el peso final de la torta entera puede variar según el tamaño solicitado. Se encarga con 24 horas de anticipación.', 99000, 'preorder', 1, 80),
    ('mousse-pistacho-chocolate-blanco-individual', 'Mousse de pistacho y chocolate blanco — individual', 'pasteleria', 'Mousse de pistacho y chocolate blanco que cautiva desde el primer bocado.', 'Mousse de pistacho y chocolate blanco que cautiva desde el primer bocado. Presentación individual.', 24000, 'direct', 0, 90),
    ('mousse-pistacho-chocolate-blanco-entero-kg', 'Mousse de pistacho y chocolate blanco — entero por kg', 'pasteleria', 'Mousse de pistacho y chocolate blanco que cautiva desde el primer bocado.', 'Mousse de pistacho y chocolate blanco que cautiva desde el primer bocado. El precio de $990 corresponde a un kilogramo; el peso final de la torta entera puede variar según el tamaño solicitado. Se encarga con 24 horas de anticipación.', 99000, 'preorder', 1, 100),
    ('mango-maracuya-individual', 'Mango y maracuyá — individual', 'pasteleria', 'Una combinación tropical de mango y maracuyá, fresca y sabrosa.', 'Una combinación tropical de mango y maracuyá, fresca y sabrosa. Presentación individual.', 24000, 'direct', 0, 110),
    ('mango-maracuya-entero-kg', 'Mango y maracuyá — entero por kg', 'pasteleria', 'Una combinación tropical de mango y maracuyá, fresca y sabrosa.', 'Una combinación tropical de mango y maracuyá, fresca y sabrosa. El precio de $990 corresponde a un kilogramo; el peso final de la torta entera puede variar según el tamaño solicitado. Se encarga con 24 horas de anticipación.', 99000, 'preorder', 1, 120),
    ('cheesecake-naranja-individual', 'Cheesecake de naranja — individual', 'pasteleria', 'Tarta de queso y naranja, fresca y con la acidez perfecta.', 'Tarta de queso y naranja, fresca y con la acidez perfecta. Presentación individual.', 24000, 'direct', 0, 130),
    ('cheesecake-naranja-entero-kg', 'Cheesecake de naranja — entero por kg', 'pasteleria', 'Tarta de queso y naranja, fresca y con la acidez perfecta.', 'Tarta de queso y naranja, fresca y con la acidez perfecta. El precio de $990 corresponde a un kilogramo; el peso final de la torta entera puede variar según el tamaño solicitado. Se encarga con 24 horas de anticipación.', 99000, 'preorder', 1, 140),
    ('crumble-manzana-individual', 'Crumble de manzana — individual', 'pasteleria', 'Crumble de manzana con diferentes texturas, ideal para acompañar con helado.', 'Crumble de manzana con diferentes texturas, ideal para acompañar con helado. Presentación individual.', 24000, 'direct', 0, 150),
    ('crumble-manzana-entero-kg', 'Crumble de manzana — entero por kg', 'pasteleria', 'Crumble de manzana con diferentes texturas, ideal para acompañar con helado.', 'Crumble de manzana con diferentes texturas, ideal para acompañar con helado. El precio de $990 corresponde a un kilogramo; el peso final de la torta entera puede variar según el tamaño solicitado. Se encarga con 24 horas de anticipación.', 99000, 'preorder', 1, 160),
    ('box-coleccion-dulce-9-postres', 'Box Colección Dulce — 9 postres variados', 'pasteleria', 'Nueve postres variados para compartir, ideal para 7 a 10 personas.', 'Selección de nueve postres variados. Sabores informados por la casa: lemon pie, mousse de Oreo, cheesecake de frutos rojos y la clásica de chocolate (especialidad de la casa). Rinde de 7 a 10 personas. Se encarga con 24 horas de anticipación.', 119000, 'preorder', 1, 170),
    ('cookie-levain-clasica-chips', 'Cookie Levain clásica con chips', 'merienda', 'Cookie clásica con chips de chocolate, ideal para acompañar con leche.', 'Cookie clásica con chips de chocolate, ideal para acompañar con leche.', 12000, 'direct', 0, 10),
    ('cookie-levain-pistacho-chocolate-blanco', 'Cookie Levain de pistacho y chocolate blanco', 'merienda', 'Cookie con pistachos premium y chocolate blanco.', 'Cookie con pistachos premium y chocolate blanco.', 12000, 'direct', 0, 20),
    ('cookie-levain-red-velvet-chocolate-blanco', 'Cookie Levain red velvet con chocolate blanco', 'merienda', 'Cookie intensa con notas de cacao y abundante chocolate blanco.', 'Cookie intensa con notas de cacao y abundante chocolate blanco.', 12000, 'direct', 0, 30),
    ('cookie-levain-cacao-100', 'Cookie Levain cacao al 100%', 'merienda', 'Cookie de chocolate intensa, irresistible y golosa.', 'Cookie de chocolate intensa, irresistible y golosa.', 12000, 'direct', 0, 40),
    ('cookie-levain-especiada', 'Cookie Levain especiada', 'merienda', 'Cookie especiada pensada especialmente para celebraciones y temporadas especiales.', 'Cookie especiada pensada especialmente para celebraciones y temporadas especiales.', 12000, 'direct', 0, 50),
    ('box-cookies-levain-6-unidades', 'Box Cookies Levain — 6 unidades', 'merienda', 'Seis cookies variadas: pistacho y chocolate blanco, cacao al 100%, red velvet y clásica con chips.', 'Seis cookies variadas. Sabores: pistacho y chocolate blanco, cacao al 100%, red velvet y chocolate blanco, y clásica con chips de chocolate. Recomendación: para disfrutarlas tibias, calentar aproximadamente 30 segundos (opcional, según preferencia).', 59000, 'direct', 0, 60),
    ('box-brownies-arturo-selection-6-unidades', 'Box Brownies Arturo Selection — 6 unidades', 'merienda', 'Seis brownies variados: Lotus, frutos rojos y Dubai (especialidad de pistacho).', 'Seis brownies variados. Variedades: Lotus, frutos rojos y Dubai, especialidad de pistacho.', 65000, 'direct', 0, 70),
    ('empanada-carne-premium', 'Empanada de carne premium', 'salados', 'Sofrito de verduras y hojaldre invertido de primera calidad.', 'Sofrito de verduras y hojaldre invertido de primera calidad.', null, 'quote', 0, 10),
    ('empanada-cerdo-braseado', 'Empanada de cerdo braseado', 'salados', 'Cerdo cocido lentamente en caldo, tierno y jugoso.', 'Cerdo cocido lentamente en caldo, tierno y jugoso.', null, 'quote', 0, 20),
    ('empanada-pollo-crema', 'Empanada de pollo a la crema', 'salados', 'Pollo suave con verduras, envuelto en hojaldre.', 'Pollo suave con verduras, envuelto en hojaldre.', null, 'quote', 0, 30),
    ('empanada-espinaca-quesos', 'Empanada de espinaca y quesos', 'salados', 'Empanada fresca, sabrosa y crocante de espinaca y quesos.', 'Empanada fresca, sabrosa y crocante de espinaca y quesos.', null, 'quote', 0, 40),
    ('tarta-calabaza-especiada', 'Tarta de calabaza especiada', 'salados', 'Calabaza al horno con especias, sofrito de verduras y mezcla de quesos en hojaldre invertido.', 'Calabaza al horno con especias, sofrito de verduras y mezcla de quesos en hojaldre invertido.', null, 'quote', 0, 50),
    ('tarta-pollo-verduras', 'Tarta de pollo y verduras', 'salados', 'Pollo con verduras salteadas en una preparación fresca y tierna.', 'Pollo con verduras salteadas en una preparación fresca y tierna.', null, 'quote', 0, 60),
    ('tarta-jamon-quesos', 'Tarta de jamón y quesos', 'salados', 'Preparación de jamón y quesos, fresca, sabrosa y crocante.', 'Preparación de jamón y quesos, fresca, sabrosa y crocante.', null, 'quote', 0, 70),
    ('pizza-rellena', 'Pizza rellena', 'salados', 'Pizza rellena de jamón, quesos y morrones asados.', 'Pizza rellena de jamón, quesos y morrones asados.', null, 'quote', 0, 80),
    ('pascualina', 'Pascualina', 'salados', 'Pascualina de estilo casero.', 'Pascualina de estilo casero.', null, 'quote', 0, 90),
    ('pack-matero-6-empanadas', 'Pack Matero — 6 empanadas variadas', 'salados', 'Seis empanadas variadas para acompañar la ronda de mate.', 'Seis empanadas variadas. La selección de sabores se coordina según disponibilidad del día: no se garantiza una combinación exacta.', 59000, 'direct', 0, 100),
    ('lunch-petit-especial-4-personas', 'Lunch Petit Especial — 4 personas', 'lunch-para-eventos', '16 sándwiches frescos, 20 jesuitas de hojaldre, pollo al escabeche y 4 postres petit.', 'Contenido: 16 sándwiches frescos con pan fresco y fiambres; 20 jesuitas de hojaldre; pollo al escabeche; 4 postres petit a elección entre lemon pie, cheesecake, clásica de chocolate y chajá. La fecha y disponibilidad se coordinan con la casa.', 195000, 'preorder', 0, 10),
    ('lunch-celebracion-10-personas', 'Lunch Celebración — 10 personas', 'lunch-para-eventos', 'Sándwiches surtidos, jesuitas, arrolladitos, canapés, pollo al escabeche y postre petit.', 'Contenido: 16 sándwiches olímpicos; 30 sándwiches surtidos; 16 sándwiches de jamón y queso; 30 jesuitas; 30 arrolladitos; 30 canapés; 1 pollo al escabeche; 1 postre petit a elección entre cheesecake, clásica de chocolate, lemon pie y Chanchada. La fecha y disponibilidad se coordinan con la casa.', 690000, 'preorder', 0, 20),
    ('lunch-de-amigos-10-personas', 'Lunch de Amigos — 10 personas', 'lunch-para-eventos', '15 empanadas grandes, pizza rellena, postre petit, jesuitas y vino tinto.', 'Contenido: 15 empanadas grandes (cerdo en caldo, carne y verduras, pollo marinado, espinaca y quesos); 1 pizza rellena de fiambres, morrones asados y ajo; 1 postre petit a elección; 20 jesuitas; 1 vino tinto. El vino se coordina previamente con la casa; no se confirma marca, variedad, volumen ni graduación alcohólica.', 490000, 'preorder', 0, 30)

) as v(
  slug, name, category_slug, short_description, full_description,
  price_cents, sale_mode, lead_time_days, position
)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do update
  set name              = excluded.name,
      category_id       = excluded.category_id,
      short_description = excluded.short_description,
      full_description  = excluded.full_description,
      price_cents       = excluded.price_cents,
      sale_mode         = excluded.sale_mode::public.sale_mode,
      lead_time_days    = excluded.lead_time_days,
      position          = excluded.position,
      status            = 'active';
