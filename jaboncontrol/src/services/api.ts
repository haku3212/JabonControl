function getDevApiUrl() {
  const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  return `http://${host}:5000/api`;
}

// API Base URL - En desarrollo usa el mismo host del navegador para no romper cookies.
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? getDevApiUrl() : '/api'
);

async function parseResponse(response: Response, endpoint: string) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && endpoint !== '/auth/login') {
      localStorage.removeItem('jc_user');
      sessionStorage.removeItem('jc_token');
      window.dispatchEvent(new Event('jc:auth-expired'));
      throw new Error('Sesion expirada. Inicie sesion nuevamente.');
    }
    throw new Error(data.error || `Error: ${response.status}`);
  }
  return data;
}

const requestOptions = (method: string, data?: any): RequestInit => {
  const token = sessionStorage.getItem('jc_token');
  return {
    method,
    credentials: 'include',
    headers: {
    'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  };
};

export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions('GET'));
    return parseResponse(response, endpoint);
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions('POST', data));
    return parseResponse(response, endpoint);
  },

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions('PUT', data));
    return parseResponse(response, endpoint);
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions('DELETE'));
    return parseResponse(response, endpoint);
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
    const rows = await apiClient.get('/hornadas');
    return rows.map((row: any) => ({
      ...row,
      ingredientes: row.ingredientes || {
        naohVolumen: Number(row.naohVolumen || 0),
        seboFund: Number(row.seboFund || 0),
        aceiteQuem: Number(row.aceiteQuem || 0),
        aceiteCrudo: Number(row.aceiteCrudo || 0),
        aceiteAlmendra: Number(row.aceiteAlmendra || 0),
        agua: Number(row.agua || 0),
        jabonRecicl: Number(row.jabonRecicl || 0),
      },
      produccionTotal: Number(row.produccionTotal || 0),
      rendimiento: Number(row.rendimiento || 0),
    }));
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
  async actualizar(id: string, data: any) {
    return apiClient.put(`/cobros/${id}`, data);
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
    return response;
  },
  async logout() {
    await apiClient.post('/auth/logout', {});
  },
  async verificar() {
    return apiClient.get('/auth/verify');
  },
};

export const usuariosService = {
  async listar() {
    return apiClient.get('/usuarios');
  },
  async crear(data: any) {
    return apiClient.post('/usuarios', data);
  },
  async actualizar(id: string, data: any) {
    return apiClient.put(`/usuarios/${id}`, data);
  },
  async eliminar(id: string) {
    return apiClient.delete(`/usuarios/${id}`);
  },
};

export const auditoriaService = {
  async listar() {
    return apiClient.get('/auditoria');
  },
  async reiniciarDatos() {
    return apiClient.post('/admin/reset-data', {});
  },
};

export const finanzasService = {
  async listarMovimientos() {
    return apiClient.get('/finanzas/movimientos');
  },
  async crearMovimiento(data: any) {
    return apiClient.post('/finanzas/movimientos', data);
  },
  async importarMovimientos(movimientos: any[]) {
    return apiClient.post('/finanzas/importar', { movimientos });
  },
  async eliminarMovimiento(id: string) {
    return apiClient.delete(`/finanzas/movimientos/${id}`);
  },
};

function createCrudService(basePath: string) {
  return {
    async listar() {
      return apiClient.get(basePath);
    },
    async crear(data: any) {
      return apiClient.post(basePath, data);
    },
    async actualizar(id: string, data: any) {
      return apiClient.put(`${basePath}/${id}`, data);
    },
    async eliminar(id: string) {
      return apiClient.delete(`${basePath}/${id}`);
    },
  };
}

export const proyectosService = createCrudService('/proyectos');
export const documentosService = createCrudService('/documentos');
export const equiposService = createCrudService('/equipos');
export const acabadoService = createCrudService('/acabado');
export const contactosService = createCrudService('/contactos');
export const cotizacionesService = createCrudService('/cotizaciones');
export const seguimientosService = createCrudService('/seguimientos');
