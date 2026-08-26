// ---------------------------------------------------------------------------
// Datos de prueba (seed) que reflejan el caso real: tienda D1 San Mateo
// (Fusagasuga). Genera ~30 dias de movimientos para que el sistema se vea
// poblado desde el primer arranque, con productos en verde, amarillo y rojo,
// y proveedores con distinto nivel de cumplimiento.
//
// Uso:  npm run seed        (o automatico con `npm run db:reset`)
// ---------------------------------------------------------------------------

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { ROLES, TIPO_MOVIMIENTO } from '../src/domain/constantes.js';
import { calcularCumplimiento } from '../src/domain/calculos.js';

const prisma = new PrismaClient();

const DIAS_HISTORIAL = 30;
const DIAS_CAMION = new Set([1, 3, 5, 6]); // Lun, Mie, Vie, Sab (getDay(): Dom=0)
const DIAS_SIN_RUIDO = 5; // los ultimos dias van sin ruido -> semaforo reproducible

// RNG determinista (mulberry32): la semilla fija hace el seed reproducible.
function crearRng(semilla) {
  let estado = semilla >>> 0;
  return function rng() {
    estado |= 0;
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = crearRng(20260902);

const enteroEntre = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

// --- Definicion del catalogo ---------------------------------------------------
// factorEntrega: fraccion de lo pedido que el proveedor suele entregar.
const PROVEEDORES = [
  { nombre: 'Latti', factorEntrega: 0.97 },
  { nombre: 'Alpina', factorEntrega: 0.88 },
  { nombre: 'Colanta', factorEntrega: 0.72 },
];

// ventaBase = ritmo de venta diario objetivo (u/dia).
// stockObjetivo = stock con el que debe quedar el producto hoy; define su
// semaforo:  stockObjetivo / ventaBase = dias de cobertura.
const PRODUCTOS = [
  { nombre: 'Leche entera bolsa 1L', categoria: 'Lacteos', proveedor: 'Latti', ventaBase: 45, stockObjetivo: 540 }, // 12 dias -> VERDE
  { nombre: 'Leche deslactosada bolsa 1L', categoria: 'Lacteos', proveedor: 'Latti', ventaBase: 20, stockObjetivo: 80 }, // 4 dias -> AMARILLO
  { nombre: 'Yogur bebible fresa 200ml', categoria: 'Lacteos', proveedor: 'Alpina', ventaBase: 30, stockObjetivo: 60 }, // 2 dias -> ROJO
  { nombre: 'Leche entera caja 1L', categoria: 'Lacteos', proveedor: 'Alpina', ventaBase: 25, stockObjetivo: 300 }, // 12 dias -> VERDE
  { nombre: 'Queso doble crema 500g', categoria: 'Lacteos', proveedor: 'Colanta', ventaBase: 12, stockObjetivo: 66 }, // 5.5 dias -> AMARILLO
  { nombre: 'Mantequilla 250g', categoria: 'Lacteos', proveedor: 'Colanta', ventaBase: 9, stockObjetivo: 18 }, // 2 dias -> ROJO
];

function fechaDia(offsetDesdeHoy) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - offsetDesdeHoy);
  return base;
}

async function limpiar() {
  // Orden respetando las claves foraneas.
  await prisma.cumplimientoHistorial.deleteMany();
  await prisma.movimiento.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.usuario.deleteMany();
}

async function main() {
  console.log('Limpiando base de datos...');
  await limpiar();

  // 1. Usuarios (contrasenas de ejemplo, documentadas en el README).
  console.log('Creando usuarios...');
  await prisma.usuario.createMany({
    data: [
      { nombre: 'admin', rol: ROLES.ADMINISTRADOR, passwordHash: bcrypt.hashSync('admin123', 10) },
      { nombre: 'empleado', rol: ROLES.EMPLEADO, passwordHash: bcrypt.hashSync('empleado123', 10) },
    ],
  });
  const usuarios = await prisma.usuario.findMany();
  const idAdmin = usuarios.find((u) => u.rol === ROLES.ADMINISTRADOR).id;
  const idEmpleado = usuarios.find((u) => u.rol === ROLES.EMPLEADO).id;

  // 2. Proveedores.
  console.log('Creando proveedores...');
  await prisma.proveedor.createMany({ data: PROVEEDORES.map((p) => ({ nombre: p.nombre })) });
  const proveedores = await prisma.proveedor.findMany();
  const proveedorPorNombre = Object.fromEntries(proveedores.map((p) => [p.nombre, p]));

  // 3. Productos (ya con el stock objetivo de hoy).
  console.log('Creando productos...');
  await prisma.producto.createMany({
    data: PRODUCTOS.map((p) => ({
      nombre: p.nombre,
      categoria: p.categoria,
      proveedorId: proveedorPorNombre[p.proveedor].id,
      stockActual: p.stockObjetivo,
    })),
  });
  const productos = await prisma.producto.findMany();
  const productoPorNombre = Object.fromEntries(productos.map((p) => [p.nombre, p]));

  // 4. Movimientos de los ultimos 30 dias + historial de cumplimiento.
  console.log(`Generando ${DIAS_HISTORIAL} dias de movimientos...`);
  const movimientos = [];
  const historial = [];
  const acumuladoProveedor = new Map(); // proveedorId -> {entradas:[]}

  for (const p of PROVEEDORES) {
    acumuladoProveedor.set(proveedorPorNombre[p.nombre].id, []);
  }

  for (let offset = DIAS_HISTORIAL - 1; offset >= 0; offset -= 1) {
    const dia = fechaDia(offset);
    const esDiaCamion = DIAS_CAMION.has(dia.getDay());
    const sinRuido = offset < DIAS_SIN_RUIDO;

    for (const def of PRODUCTOS) {
      const producto = productoPorNombre[def.nombre];
      const proveedor = PROVEEDORES.find((pr) => pr.nombre === def.proveedor);

      // ENTRADA: llega el camion. Se pide ~1.8 dias de venta y el proveedor
      // entrega una fraccion (factorEntrega) -> de aqui sale su confiabilidad.
      if (esDiaCamion) {
        const solicitada = Math.round(def.ventaBase * 1.8);
        const factor = proveedor.factorEntrega + (rng() - 0.5) * 0.06;
        const entregada = Math.max(1, Math.round(solicitada * factor));

        const fechaEntrada = new Date(dia);
        fechaEntrada.setHours(8, 0, 0, 0);
        movimientos.push({
          productoId: producto.id,
          usuarioId: rng() < 0.5 ? idEmpleado : idAdmin,
          tipo: TIPO_MOVIMIENTO.ENTRADA,
          cantidad: entregada,
          cantidadSolicitada: solicitada,
          fecha: fechaEntrada,
        });

        // Recalculo incremental del cumplimiento del proveedor (igual que en
        // produccion: se recalcula y se guarda foto en cada ENTRADA).
        const lista = acumuladoProveedor.get(producto.proveedorId);
        lista.push({ cantidad: entregada, cantidadSolicitada: solicitada });
        const { porcentaje, totalPedido, totalEntregado } = calcularCumplimiento(lista);
        historial.push({
          proveedorId: producto.proveedorId,
          porcentaje,
          totalPedido,
          totalEntregado,
          fecha: fechaEntrada,
        });
      }

      // SALIDA: ventas del dia. Los ultimos dias van sin ruido para que el
      // semaforo del arranque sea exactamente stockObjetivo / ventaBase.
      const ruido = sinRuido ? 0 : enteroEntre(-Math.ceil(def.ventaBase * 0.25), Math.ceil(def.ventaBase * 0.25));
      const cantidadVenta = Math.max(1, def.ventaBase + ruido);
      // Hora temprana (9:00) para que un movimiento registrado hoy por el
      // usuario aparezca de primero en "Actividad reciente".
      const fechaSalida = new Date(dia);
      fechaSalida.setHours(9, 0, 0, 0);
      movimientos.push({
        productoId: producto.id,
        usuarioId: rng() < 0.7 ? idEmpleado : idAdmin,
        tipo: TIPO_MOVIMIENTO.SALIDA,
        cantidad: cantidadVenta,
        cantidadSolicitada: null,
        fecha: fechaSalida,
      });
    }
  }

  console.log(`Insertando ${movimientos.length} movimientos y ${historial.length} registros de historial...`);
  await prisma.movimiento.createMany({ data: movimientos });
  await prisma.cumplimientoHistorial.createMany({ data: historial });

  // 5. Fijar el % de cumplimiento actual de cada proveedor (ultimo acumulado).
  for (const [proveedorId, entradas] of acumuladoProveedor.entries()) {
    const { porcentaje } = calcularCumplimiento(entradas);
    await prisma.proveedor.update({
      where: { id: proveedorId },
      data: { porcentajeCumplimiento: porcentaje },
    });
  }

  // --- Resumen ---------------------------------------------------------------
  const resumenProv = await prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } });
  console.log('\nSeed completado.');
  console.log('Usuarios de prueba creados (consultar credenciales con el administrador).');
  console.log('Proveedores y cumplimiento:');
  for (const p of resumenProv) console.log(`  - ${p.nombre}: ${p.porcentajeCumplimiento}%`);
  console.log('Productos:');
  for (const def of PRODUCTOS) {
    console.log(`  - ${def.nombre}: stock ${def.stockObjetivo}, ~${(def.stockObjetivo / def.ventaBase).toFixed(1)} dias de cobertura`);
  }
}

main()
  .catch((error) => {
    console.error('Error en el seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
