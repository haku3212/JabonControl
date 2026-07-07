# Despliegue en Railway

## Error: JWT_SECRET es obligatorio en produccion

Ese error significa que Railway esta ejecutando la app con `NODE_ENV=production`, pero no tiene configurada la variable `JWT_SECRET`.

## Variables obligatorias

En Railway, entre a su proyecto y abra:

`Variables` -> `New Variable`

Agregue:

```env
NODE_ENV=production
DATABASE_URL=postgresql://usuario:contrasena@host:puerto/base
JWT_SECRET=pegue_aqui_un_secreto_largo
ADMIN_PASSWORD=pegue_aqui_una_contrasena_admin_segura
ENABLE_DEMO_DATA=false
CORS_ORIGIN=https://su-url-de-railway.up.railway.app
JWT_EXPIRE=7d
PASSWORD_MAX_DAYS=180
AUTH_COOKIE_NAME=jc_session
```

`DATABASE_URL` debe venir del servicio PostgreSQL de Railway. Si no configura esa variable, la app puede arrancar con archivo local, pero no es lo recomendado para produccion.

## Como generar JWT_SECRET

En PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copie el resultado y peguelo como `JWT_SECRET`.

## Comando de build

Railway debe ejecutar:

```bash
npm run build
```

Ese comando instala backend, instala frontend, compila Vite y copia `jaboncontrol/dist` a `backend/public`.

## Comando de inicio

Railway debe ejecutar:

```bash
npm start
```

Ese comando inicia:

```bash
node backend/server.js
```

## Despues de configurar variables

1. Guarde las variables.
2. Haga redeploy.
3. Abra la URL publica de Railway.
4. Inicie sesion con:
   - Usuario: `admin`
   - Contrasena: la que puso en `ADMIN_PASSWORD`
