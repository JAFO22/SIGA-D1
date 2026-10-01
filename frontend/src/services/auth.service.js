import apiClient from './apiClient.js';

export async function login(nombre, password) {
  const { data } = await apiClient.post('/auth/login', { nombre, password });
  return data;
}

export async function obtenerPerfil() {
  const { data } = await apiClient.get('/auth/me');
  return data.usuario;
}

export async function registrarUsuario(payload) {
  const { data } = await apiClient.post('/auth/registro', payload);
  return data;
}

export async function listarUsuarios() {
  const { data } = await apiClient.get('/auth/usuarios');
  return data;
}

