# JabonControl Backend

API REST para JabonControl - Sistema ERP para Jabonería

## Instalación

```bash
npm install
```

## Configuración

Crear archivo `.env`:

```
PORT=5000
NODE_ENV=development
JWT_SECRET=tu_super_secreto_jwt_jaboncontrol_2026
JWT_EXPIRE=7d
DATABASE=./database.sqlite
```

## Iniciar servidor

```bash
npm start
```

El servidor se ejecutará en `http://localhost:5000`

## Credenciales por defecto

- **Usuario:** admin
- **Contraseña:** admin123
- **Rol:** admin

## Endpoints disponibles

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Crear usuario (solo admin)
- `GET /api/auth/verify` - Verificar token

### Ventas
- `GET /api/ventas` - Listar ventas
- `POST /api/ventas` - Crear venta
- `DELETE /api/ventas/:id` - Eliminar venta

### Cobros
- `GET /api/cobros` - Listar cobros
- `POST /api/cobros` - Registrar cobro
- `DELETE /api/cobros/:id` - Eliminar cobro

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Hornadas
- `GET /api/hornadas` - Listar hornadas
- `POST /api/hornadas` - Registrar hornada
- `DELETE /api/hornadas/:id` - Eliminar hornada

### Materias Primas
- `GET /api/materias` - Listar recepciones
- `POST /api/materias` - Registrar recepción
- `DELETE /api/materias/:id` - Eliminar recepción

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

## Base de datos

SQLite automáticamente se crea en `database.sqlite` con las siguientes tablas:

- usuarios
- clientes
- ventas
- cobros
- hornadas
- materias_primas
- recepciones

## Deployment en Railway

1. Sube el código a GitHub
2. Crea cuenta en railway.app
3. Conecta tu repositorio GitHub
4. Agrega variables de entorno en Railway
5. Deploy automático

## Tecnologías

- Node.js
- Express.js
- SQLite3
- JWT (JSON Web Tokens)
- bcryptjs (Encriptación de contraseñas)
- CORS
