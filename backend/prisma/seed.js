import { PrismaClient } from '@prisma/client';
import { ROLES, TIPO_MOVIMIENTO } from '../src/domain/constantes.js';
import { calcularCumplimiento } from '../src/domain/calculos.js';
import { cifrarContrasena } from '../src/lib/contrasenas.js';

const prisma = new PrismaClient();

const DIAS_HISTORIAL = 30;
const DIAS_CAMION = new Set([1, 3, 5, 6]);
const DIAS_SIN_RUIDO = 5;

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

const PROVEEDORES = [
  { nombre: 'Latti', factorEntrega: 0.97 },
  { nombre: 'Alpina', factorEntrega: 0.88 },
  { nombre: 'Colanta', factorEntrega: 0.72 },
];

const PRODUCTOS = [
  { nombre: 'Leche entera bolsa 1L', categoria: 'Lacteos', proveedor: 'Latti', ventaBase: 45, stockObjetivo: 540 },
  { nombre: 'Leche deslactosada bolsa 1L', categoria: 'Lacteos', proveedor: 'Latti', ventaBase: 20, stockObjetivo: 80 },
  { nombre: 'Yogur bebible fresa 200ml', categoria: 'Lacteos', proveedor: 'Alpina', ventaBase: 30, stockObjetivo: 60 },
  { nombre: 'Leche entera caja 1L', categoria: 'Lacteos', proveedor: 'Alpina', ventaBase: 25, stockObjetivo: 300 },
  { nombre: 'Queso doble crema 500g', categoria: 'Lacteos', proveedor: 'Colanta', ventaBase: 12, stockObjetivo: 66 },
  { nombre: 'Mantequilla 250g', categoria: 'Lacteos', proveedor: 'Colanta', ventaBase: 9, stockObjetivo: 18 },
];

function fechaDia(offsetDesdeHoy) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - offsetDesdeHoy);
  return base;
}

const CONTRASENA_DEMO = { admin: 'admin123', empleado: 'empleado123' };

const contrasenas = {
  admin: process.env.SEED_ADMIN_PASSWORD || CONTRASENA_DEMO.admin,
  empleado: process.env.SEED_EMPLEADO_PASSWORD || CONTRASENA_DEMO.empleado,
};

const forzarReinicio = process.env.SEED_FORZAR === 'true';

async function vaciarBaseDeDatos() {
  await prisma.cumplimientoHistorial.deleteMany();
  await prisma.movimiento.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.usuario.deleteMany();
}

async function yaTieneDatos() {
  return (await prisma.usuario.count()) > 0;
}

function avisarSiHayContrasenasDemo() {
  const usaDemo =
    contrasenas.admin === CONTRASENA_DEMO.admin ||
    contrasenas.empleado === CONTRASENA_DEMO.empleado;

  if (usaDemo && process.env.NODE_ENV === 'production') {
    console.warn(
      'AVISO: se estan usando las contrasenas de demostracion. Defina ' +
        'SEED_ADMIN_PASSWORD y SEED_EMPLEADO_PASSWORD, o cambielas tras el primer acceso.',
    );
  }
}

async function main() {
  if (await yaTieneDatos()) {
    if (!forzarReinicio) {
      console.log('La base de datos ya tiene informacion: no se toca nada.');
      console.log('Para regenerar los datos de ejemplo: SEED_FORZAR=true npm run seed');
      return;
    }
    console.log('SEED_FORZAR activo: vaciando la base de datos...');
    await vaciarBaseDeDatos();
  }

  avisarSiHayContrasenasDemo();

  console.log('Creando usuarios...');
  await prisma.usuario.createMany({
    data: [
      {
        nombre: 'admin',
        rol: ROLES.ADMINISTRADOR,
        passwordHash: await cifrarContrasena(contrasenas.admin),
      },
      {
        nombre: 'empleado',
        rol: ROLES.EMPLEADO,
        passwordHash: await cifrarContrasena(contrasenas.empleado),
      },
    ],
  });
  const usuarios = await prisma.usuario.findMany();
  const idAdmin = usuarios.find((u) => u.rol === ROLES.ADMINISTRADOR).id;
  const idEmpleado = usuarios.find((u) => u.rol === ROLES.EMPLEADO).id;

  console.log('Creando proveedores...');
  await prisma.proveedor.createMany({ data: PROVEEDORES.map((p) => ({ nombre: p.nombre })) });
  const proveedores = await prisma.proveedor.findMany();
  const proveedorPorNombre = Object.fromEntries(proveedores.map((p) => [p.nombre, p]));

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

  console.log(`Generando ${DIAS_HISTORIAL} dias de movimientos...`);
  const movimientos = [];
  const historial = [];
  const acumuladoProveedor = new Map();

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

      const ruido = sinRuido ? 0 : enteroEntre(-Math.ceil(def.ventaBase * 0.25), Math.ceil(def.ventaBase * 0.25));
      const cantidadVenta = Math.max(1, def.ventaBase + ruido);

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

  for (const [proveedorId, entradas] of acumuladoProveedor.entries()) {
    const { porcentaje } = calcularCumplimiento(entradas);
    await prisma.proveedor.update({
      where: { id: proveedorId },
      data: { porcentajeCumplimiento: porcentaje },
    });
  }

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
