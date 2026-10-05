import apiClient from './apiClient.js';

export async function listarUsuarios() {
  const { data } = await apiClient.get('/usuarios');
  return data;
}

export async function crearUsuario(payload) {
  const { data } = await apiClient.post('/usuarios', payload);
  return data;
}
