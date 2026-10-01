import apiClient from './apiClient.js';

export async function listarProveedores() {
  const { data } = await apiClient.get('/proveedores');
  return data;
}

export async function crearProveedor(payload) {
  const { data } = await apiClient.post('/proveedores', payload);
  return data;
}

export async function actualizarProveedor(id, payload) {
  const { data } = await apiClient.put(`/proveedores/${id}`, payload);
  return data;
}

export async function eliminarProveedor(id) {
  await apiClient.delete(`/proveedores/${id}`);
}

export async function obtenerConfiabilidad() {
  const { data } = await apiClient.get('/proveedores/confiabilidad');
  return data;
}
