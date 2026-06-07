# JabonControl — Sistema de Gestión Industrial

Una aplicación web moderna para la gestión integral de operaciones en una fábrica de jabón, desarrollada con **React 18**, **TypeScript** y **Tailwind CSS**.

## 🚀 Características

### Módulos Principales

1. **Dashboard** 📊
   - KPIs en tiempo real
   - Gráficos de producción
   - Últimas ventas
   - Stock de materias primas
   - Alertas activas

2. **Producción** 🔥
   - **Materias Primas**: Gestión de recepciones y stock
   - **Hornadas**: Registro de producción diaria
   - **Acabado**: Control de compresora y sellado

3. **Comercial** 💼
   - **Ventas**: Notas de entrega y facturación
   - **Cobros**: Gestión de cuentas por cobrar
   - **Clientes**: Directorio y análisis por cliente

4. **Gestión** ⚙️
   - **Proyectos**: Seguimiento de iniciativas
   - **Documentación**: Permisos y certificaciones
   - **Equipos**: Inventario y mantenimiento
   - **Reportes**: Análisis y exportación

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn

## 🔧 Instalación

```bash
cd jaboncontrol
npm install
```

## 🏃 Ejecución

**Desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

**Producción:**
```bash
npm run build
npm run preview
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── common/           # Componentes reutilizables
│   │   ├── KPICard.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── BarChart.tsx
│   │   ├── StockBar.tsx
│   │   ├── Tabs.tsx
│   │   └── Notification.tsx
│   ├── panels/           # Paneles de cada módulo
│   │   ├── Dashboard.tsx
│   │   ├── MateriasPrimas.tsx
│   │   ├── Hornadas.tsx
│   │   ├── Acabado.tsx
│   │   ├── Ventas.tsx
│   │   ├── Cobros.tsx
│   │   ├── Clientes.tsx
│   │   ├── Proyectos.tsx
│   │   ├── Documentacion.tsx
│   │   ├── Equipos.tsx
│   │   └── Reportes.tsx
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── context/
│   └── AppContext.tsx    # Gestión de estado global
├── hooks/
│   └── useStorage.ts     # Hook para localStorage
├── types/
│   └── index.ts          # Tipos TypeScript
├── App.tsx               # Componente raíz
├── main.tsx              # Punto de entrada
└── index.css             # Estilos globales
```

## 🎨 Diseño

- **Tema**: Dark mode profesional con acentos amarillo, naranja y azul
- **Fuentes**: Bebas Neue, IBM Plex Sans, IBM Plex Mono
- **Estilo**: Industrial moderno con focus en usabilidad
- **Responsive**: Diseño adaptable a diferentes pantallas

## 🔐 Autenticación

Actualmente sin autenticación. Para agregar:

```bash
npm install @auth0/auth0-react
# o
npm install next-auth
```

## 💾 Persistencia de Datos

Los datos se almacenan en **localStorage** actualmente. Para agregar backend:

```bash
npm install axios
```

Ejemplo de integración con API:

```typescript
const response = await axios.post('/api/ventas', ventaData);
```

## 📊 Gráficos Avanzados

Para gráficos más avanzados, instala:

```bash
npm install recharts
# o
npm install chart.js react-chartjs-2
```

## 📱 Responsive Design

La aplicación es responsive y funciona en:
- Desktop (1920x1080+)
- Tablets (768x1024)
- Móviles (375x812)

## 🚀 Mejoras Futuras

- [ ] Backend con Node.js/Express
- [ ] Base de datos PostgreSQL/MongoDB
- [ ] Autenticación con JWT
- [ ] Gráficos avanzados con Recharts
- [ ] Exportación a PDF/Excel
- [ ] Búsqueda y filtros avanzados
- [ ] Notificaciones en tiempo real
- [ ] Modo offline
- [ ] Dark/Light mode toggle
- [ ] Multi-idioma (ES/EN)

## 📝 Licencia

Código propietario - © 2026 Alisarsrl

## 🤝 Soporte

Para reportar bugs o sugerencias, contactar al desarrollador.

---

Desarrollado con ❤️ usando React + TypeScript + Tailwind CSS
