import apiClient from './apiClient.js';

export async function listarProductos() {
  const { data } = await apiClient.get('/productos');
  return data;
}

export async function crearProducto(payload) {
  const { data } = await apiClient.post('/productos', payload);
  return data;
}

export async function actualizarProducto(id, payload) {
  const { data } = await apiClient.put(`/productos/${id}`, payload);
  return data;
}

export async function eliminarProducto(id) {
  await apiClient.delete(`/productos/${id}`);
}
