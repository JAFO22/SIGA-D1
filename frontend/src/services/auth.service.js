import apiClient from './apiClient.js';

export async function login(nombre, password) {
  const { data } = await apiClient.post('/auth/login', { nombre, password });
  return data;
}
