// API Base URL - Conecta al backend en Railway o localhost en desarrollo
const API_BASE_URL = 'https://jaboncontrol-production.up.railway.app/api';

export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
  },

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
  },
};

// Servicios específicos
export const ventasService = {
  async listar() {
    return apiClient.get('/ventas');
  },
  async crear(data: any) {
    return apiClient.post('/ventas', data);
  },
  async actualizar(id: string, data: any) {
    return apiClient.put(`/ventas/${id}`, data);
  },
  async eliminar(id: string) {
    return apiClient.delete(`/ventas/${id}`);
  },
};

export const clientesService = {
  async listar() {
    return apiClient.get('/clientes');
  },
  async crear(data: any) {
    return apiClient.post('/clientes', data);
  },
  async actualizar(id: string, data: any) {
    return apiClient.put(`/clientes/${id}`, data);
  },
  async eliminar(id: string) {
    return apiClient.delete(`/clientes/${id}`);
  },
};

export const hornadasService = {
  async listar() {
    return apiClient.get('/hornadas');
  },
  async crear(data: any) {
    return apiClient.post('/hornadas', data);
  },
  async eliminar(id: string) {
    return apiClient.delete(`/hornadas/${id}`);
  },
};

export const cobrosService = {
  async listar() {
    return apiClient.get('/cobros');
  },
  async crear(data: any) {
    return apiClient.post('/cobros', data);
  },
  async eliminar(id: string) {
    return apiClient.delete(`/cobros/${id}`);
  },
};

export const materiasService = {
  async listar() {
    return apiClient.get('/materias');
  },
  async crear(data: any) {
    return apiClient.post('/materias', data);
  },
  async eliminar(id: string) {
    return apiClient.delete(`/materias/${id}`);
  },
};

export const authService = {
  async login(usuario: string, password: string) {
    const response = await apiClient.post('/auth/login', { usuario, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },
  async logout() {
    localStorage.removeItem('token');
  },
  async verificar() {
    return apiClient.get('/auth/verify');
  },
};
