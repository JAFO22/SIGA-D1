import apiClient from './apiClient.js';

export async function obtenerResumenDashboard() {
  const { data } = await apiClient.get('/dashboard');
  return data;
}
