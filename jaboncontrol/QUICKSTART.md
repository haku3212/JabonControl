# ⚡ Quick Start Guide — 5 Minutos

## 1️⃣ Iniciar la Aplicación (1 minuto)

```bash
cd C:\Users\Armando\Desktop\alisarsrl\jaboncontrol
npm run dev
```

Luego abre: **http://localhost:5173**

---

## 2️⃣ Explorar la Interfaz (2 minutos)

### Sidebar (Izquierda)
- 📊 **Dashboard**: Vista general del negocio
- 🧪 **Materias Primas**: Stock y recepciones
- 🔥 **Hornadas**: Producción diaria
- 📦 **Acabado**: Compresora y sellado
- 🛒 **Ventas**: Notas de entrega
- 💰 **Cobros**: Pagos recibidos
- 👥 **Clientes**: Directorio
- 🏗️ **Proyectos**: Iniciativas
- 📋 **Documentación**: Permisos
- ⚙️ **Equipos**: Maquinaria
- 📈 **Reportes**: Análisis

### Topbar (Arriba)
- Título de página actual
- Breadcrumb de navegación
- Fecha del día
- Botón "+ NUEVO REGISTRO"

---

## 3️⃣ Probar Funcionalidades (1.5 minutos)

### Dashboard 📊
```
Haz clic en "📊 Dashboard" en el sidebar
Verás:
- 4 KPIs grandes (producción, stock, ventas, cobros)
- Gráfico de producción últimos 7 días
- Últimas 4 ventas registradas
- Stock de materias primas
- 3 alertas activas
```

### Ventas 🛒
```
Haz clic en "🛒 Ventas"
Verás:
- Filtro por estado (Todos, Cancelado, Crédito)
- Buscador de cliente
- Tabla de notas de entrega
- Datos en tiempo real
```

### Clientes 👥
```
Haz clic en "👥 Clientes"
Verás:
- Buscador por nombre
- Tabla con clientes
- Balance de cada cliente
- Estado de pagos
```

### Hornadas 🔥
```
Haz clic en "🔥 Hornadas"
Verás:
- 3 KPIs de producción
- Tarjetas de hornadas completadas
- Ingredientes usados
- Rendimiento de cada operario
```

### Materias Primas 🧪
```
Haz clic en "🧪 Materias Primas"
Verás:
- Tab 1: Recepciones (búsqueda funcional)
- Tab 2: Tanques líquidos (3 tanques con estado)
- Tab 3: Stock sólidos (tabla con inventario)
```

---

## 4️⃣ Agregar un Nuevo Registro (0.5 minutos)

### Clic en "+ NUEVO REGISTRO"
```
1. Se abre un modal
2. Completa los campos
3. Haz clic en "💾 Guardar"
4. Verás una notificación: ✅ Registro guardado correctamente
5. El registro se agregará a la tabla
```

**Nota**: Los datos se guardan en **localStorage** (navegador)

---

## 5️⃣ Buscar y Filtrar (0.5 minutos)

### En Ventas:
```
1. Filtro dropdown: "Todos los estados" → "Cancelado"
2. Input search: "Distribuidor" → Filtra clientes
3. Los resultados se actualizan en tiempo real
```

### En Clientes:
```
1. Input search: "Santa Cruz" → Filtra clientes
2. Ver solo clientes que coincidan
```

### En Materias Primas:
```
1. Busca por proveedor o producto
2. Resultados inmediatos
```

---

## 🎨 Personalizar Colores

### Archivo: `tailwind.config.js`

```javascript
colors: {
  'accent': {
    'yellow': '#e8b84b',   // Cambiar este color
    'orange': '#d4722a',
    'blue': '#4b9fe8',
  },
  'status': {
    'success': '#4be87a',  // O este
    'danger': '#e84b4b',   // O este
  }
}
```

Luego recarga la página para ver los cambios.

---

## 📱 Ver en Móvil

### Opción 1: Tu teléfono
```
1. En navegador PC: http://localhost:5173
2. En teléfono: http://192.168.x.x:5173
3. (Reemplaza la IP con la de tu PC en tu red)
```

### Opción 2: DevTools
```
F12 → Ctrl+Shift+M → Selecciona dispositivo
```

---

## 🔄 Ver Datos en Tiempo Real

Los datos se actualizan cuando:
- ✅ Agregas un nuevo registro
- ✅ Cambias de panel
- ✅ Refrescas la página (F5)
- ✅ Esperas ~3 segundos (se sincroniza)

---

## 🐛 Si Algo Falla

### Error: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Error: "Port already in use"
```bash
# Cambiar puerto en vite.config.ts
export default {
  server: {
    port: 5174  // Usar otro puerto
  }
}
```

### Datos no se guardan
```bash
# Abre DevTools (F12)
# Abre Application → Local Storage → http://localhost:5173
# Deberías ver los datos almacenados
```

---

## ✨ Cheat Sheet de Componentes

### Dentro del código:

```typescript
// KPI Card
<KPICard
  label="Producción Hoy"
  value="842"
  unit="kg procesados"
  color="yellow"
  delta={{ value: 12, positive: true }}
/>

// Card con datos
<Card title="Mi Tarjeta" badge={{ label: 'Activo', type: 'success' }}>
  Contenido aquí
</Card>

// Badge de estado
<Badge label="Cancelado" type="success" />

// Modal
<Modal
  isOpen={showModal}
  title="Nuevo Registro"
  onClose={() => setShowModal(false)}
  onSave={handleSave}
>
  {/* Formulario aquí */}
</Modal>

// Tabs
<Tabs
  tabs={[
    { id: 'tab1', label: 'Tab 1', content: <div>Contenido 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div>Contenido 2</div> },
  ]}
/>
```

---

## 📊 Agregar Datos Manualmente

En `src/context/AppContext.tsx`:

```typescript
const initialVentas: Venta[] = [
  // Aquí agregamos más ventas de ejemplo
  {
    id: '3',
    numeroNE: 'NE-0043',
    fecha: '2026-06-03',
    cliente: 'Mi Cliente',
    formato: 'Cajas',
    cantidad: 100,
    precioUnitario: 25,
    precioTotal: 2500,
    tipoPago: 'cancelado',
  },
  // ... más registros
];
```

Recarga la página para ver los cambios.

---

## 🚀 Próximos Pasos

### Si quieres backend (MongoDB):

```bash
# En carpeta server/
npm install express cors mongoose
# Luego sigue BACKEND_SETUP.md
```

### Si quieres gráficos avanzados:

```bash
npm install recharts
# Reemplaza BarChart.tsx por componentes Recharts
```

### Si quieres exportar a PDF:

```bash
npm install jspdf html2canvas
# Agrega botón "Exportar PDF"
```

---

## 💾 Guardar Todo en Git

```bash
cd jaboncontrol
git init
git add .
git commit -m "JabonControl ERP v1.0 - Completo"
git remote add origin https://github.com/tu-usuario/jaboncontrol.git
git push -u origin main
```

---

## 📞 Comandos Útiles

```bash
npm run dev      # Iniciar desarrollo
npm run build    # Hacer build para producción
npm run preview  # Ver build localmente
npm run lint     # Verificar código
```

---

## 🎯 Resumen en Números

```
⏱️  Tiempo de setup:           < 1 minuto
📦 Tamaño del proyecto:       ~500KB
🎨 Componentes reutilizables: 20+
📊 Módulos funcionales:       11
💾 Datos de ejemplo:          Pre-cargados
🔧 Personalizable:            100%
```

---

## ✅ Checklist para Empezar

- [ ] Instalé dependencias (`npm install`)
- [ ] Ejecuté `npm run dev`
- [ ] Abrí http://localhost:5173
- [ ] Exploré todos los módulos
- [ ] Probé crear un nuevo registro
- [ ] Probé buscar/filtrar
- [ ] Revisé el código en `src/`
- [ ] Personalicé colores si quise
- [ ] Guardé en Git

---

## 🎉 ¡Listo!

Ahora tienes una aplicación ERP profesional funcionando.

**Próxima meta**: Crear el backend en 1-2 días

¿Qué necesitas primero?
- Backend con API
- Más módulos
- Reportes PDF
- Autenticación

**¡Elige uno y vamos!** 🚀

---

*Para ayuda detallada, lee README.md, FEATURES.md o BACKEND_SETUP.md*
