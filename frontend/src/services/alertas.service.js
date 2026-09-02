import apiClient from './apiClient.js';

export async function listarAlertas() {
  const { data } = await apiClient.get('/alertas');
  return data;
}

export async function obtenerConfigSemaforo() {
  const { data } = await apiClient.get('/alertas/config');
  return data; // { diasAmarillo, diasRojo, ventasMuestra }
}
