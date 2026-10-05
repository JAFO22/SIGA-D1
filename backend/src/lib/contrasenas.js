import bcrypt from 'bcryptjs';

const COSTO_DEL_HASH = 10;

export function cifrarContrasena(contrasena) {
  return bcrypt.hash(contrasena, COSTO_DEL_HASH);
}

export function coincideContrasena(contrasena, hash) {
  return bcrypt.compare(contrasena, hash);
}
