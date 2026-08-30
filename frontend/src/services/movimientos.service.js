import apiClient from './apiClient.js';

export async function listarMovimientos(params = {}) {
  const { data } = await apiClient.get('/movimientos', { params });
  return data;
}

export async function registrarMovimiento(payload) {
  const { data } = await apiClient.post('/movimientos', payload);
  return data;
}
