# Guía de Integración con Backend

## Setup Rápido del Backend con Node.js + Express

### 1. Crear el servidor

```bash
mkdir server
cd server
npm init -y
npm install express cors dotenv mongoose
npm install -D nodemon
```

### 2. Estructura del servidor

```
server/
├── models/
│   ├── Venta.js
│   ├── Hornada.js
│   ├── Cliente.js
│   ├── Recepcion.js
│   ├── Cobro.js
│   └── Proyecto.js
├── routes/
│   ├── ventas.js
│   ├── hornadas.js
│   ├── clientes.js
│   ├── recepciones.js
│   ├── cobros.js
│   └── proyectos.js
├── controllers/
│   ├── ventasController.js
│   ├── hornadsController.js
│   └── ...
├── .env
├── server.js
└── package.json
```

### 3. Archivo server.js básico

```javascript
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexión MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jaboncontrol', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Rutas
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/hornadas', require('./routes/hornadas'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/recepciones', require('./routes/recepciones'));
app.use('/api/cobros', require('./routes/cobros'));
app.use('/api/proyectos', require('./routes/proyectos'));

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 4. Actualizar frontend para consumir API

```typescript
// src/context/AppContext.tsx

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function AppProvider({ children }: { children: ReactNode }) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  
  useEffect(() => {
    // Cargar datos del servidor
    axios.get(`${API_URL}/ventas`).then(res => setVentas(res.data));
  }, []);

  const addVenta = async (data: Venta) => {
    const response = await axios.post(`${API_URL}/ventas`, data);
    setVentas([...ventas, response.data]);
  };

  // ... resto del código
}
```

## Modelos MongoDB

### Venta
```javascript
const ventaSchema = new Schema({
  numeroNE: { type: String, required: true, unique: true },
  fecha: { type: Date, required: true },
  cliente: { type: String, required: true },
  formato: { type: String, enum: ['cajas', 'nodulos', 'barras'] },
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
  precioTotal: { type: Number, required: true },
  tipoPago: { type: String, enum: ['cancelado', 'credito'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### Hornada
```javascript
const hornadaSchema = new Schema({
  numero: { type: String, required: true, unique: true },
  fecha: { type: Date, required: true },
  horaInicio: String,
  operario: String,
  ingredientes: {
    naoh: Number,
    seboFund: Number,
    aceiteQuem: Number,
    aceiteCrudo: Number,
    aceiteAlmendra: Number,
    agua: Number,
    jabonRecicl: Number,
  },
  produccionTotal: Number,
  rendimiento: Number,
  observaciones: String,
  createdAt: { type: Date, default: Date.now }
});
```

## Variables de Entorno del Backend

```env
# .env
MONGODB_URI=mongodb://localhost:27017/jaboncontrol
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

## Rutas API Sugeridas

```
GET    /api/ventas              - Obtener todas las ventas
POST   /api/ventas              - Crear nueva venta
GET    /api/ventas/:id          - Obtener venta específica
PUT    /api/ventas/:id          - Actualizar venta
DELETE /api/ventas/:id          - Eliminar venta

GET    /api/hornadas            - Obtener todas las hornadas
POST   /api/hornadas            - Crear nueva hornada
GET    /api/hornadas/:id        - Obtener hornada específica
PUT    /api/hornadas/:id        - Actualizar hornada

GET    /api/clientes            - Obtener todos los clientes
POST   /api/clientes            - Crear nuevo cliente
GET    /api/clientes/:id        - Obtener cliente específico
PUT    /api/clientes/:id        - Actualizar cliente

GET    /api/recepciones         - Obtener recepciones
POST   /api/recepciones         - Crear recepción
GET    /api/recepciones/:id     - Obtener recepción específica

GET    /api/cobros              - Obtener cobros
POST   /api/cobros              - Registrar cobro
GET    /api/cobros/:id          - Obtener cobro específico

GET    /api/proyectos           - Obtener proyectos
POST   /api/proyectos           - Crear proyecto
PUT    /api/proyectos/:id       - Actualizar proyecto

GET    /api/dashboard           - Obtener KPIs del dashboard
```

## Docker (Opcional)

### docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: jaboncontrol_db
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: jaboncontrol
    volumes:
      - mongo_data:/data/db

  server:
    build: ./server
    container_name: jaboncontrol_server
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    environment:
      MONGODB_URI: mongodb://mongodb:27017/jaboncontrol
      NODE_ENV: development
    volumes:
      - ./server:/app

  frontend:
    build: .
    container_name: jaboncontrol_frontend
    ports:
      - "5173:5173"
    depends_on:
      - server

volumes:
  mongo_data:
```

## Testing

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Ejecutar tests
npm run test
```

## Autenticación con JWT

```javascript
// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

---

¡Tu backend está listo para conectar con el frontend de JabonControl!
