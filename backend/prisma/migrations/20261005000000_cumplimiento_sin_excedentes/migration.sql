WITH cumplimiento AS (
  SELECT
    pr."proveedorId",
    SUM(m."cantidadSolicitada") AS "totalPedido",
    SUM(LEAST(m."cantidad", m."cantidadSolicitada")) AS "totalEntregado",
    SUM(m."cantidad") > SUM(LEAST(m."cantidad", m."cantidadSolicitada")) AS "teniaExcedentes"
  FROM "Movimiento" m
  JOIN "Producto" pr ON pr."id" = m."productoId"
  WHERE m."tipo" = 'ENTRADA' AND m."cantidadSolicitada" > 0
  GROUP BY pr."proveedorId"
),
recalculados AS (
  UPDATE "Proveedor" p
  SET "porcentajeCumplimiento" = ROUND(100.0 * c."totalEntregado" / c."totalPedido", 2)
  FROM cumplimiento c
  WHERE p."id" = c."proveedorId" AND c."teniaExcedentes"
  RETURNING p."id", p."porcentajeCumplimiento", c."totalPedido", c."totalEntregado"
)
INSERT INTO "CumplimientoHistorial" ("proveedorId", "porcentaje", "totalPedido", "totalEntregado")
SELECT "id", "porcentajeCumplimiento", "totalPedido", "totalEntregado" FROM recalculados;
