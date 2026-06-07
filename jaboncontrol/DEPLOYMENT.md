# 🚀 Guía de Deployment

## GitHub Setup

### 1. Inicializar Git

```bash
cd jaboncontrol
git init
git add .
git commit -m "Initial commit: JabonControl ERP v1.0"
```

### 2. Crear repositorio en GitHub

```bash
# Opción 1: HTTPS
git remote add origin https://github.com/tu-usuario/jaboncontrol.git
git branch -M main
git push -u origin main

# Opción 2: SSH
git remote add origin git@github.com:tu-usuario/jaboncontrol.git
git branch -M main
git push -u origin main
```

### 3. Estructura recomendada del repositorio

```
jaboncontrol/
├── frontend/              # Este proyecto
├── backend/               # Servidor Node.js
├── docs/                  # Documentación adicional
├── docker-compose.yml
├── .github/
│   └── workflows/         # CI/CD pipelines
├── .gitignore
└── README.md
```

## Deployment en Vercel (Frontend)

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
vercel
# Seguir las instrucciones interactivas
```

### 3. Variables de entorno

En Vercel dashboard:
```
VITE_API_URL=https://tu-api.herokuapp.com/api
```

## Deployment en Heroku (Backend)

### 1. Instalar Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Descargar desde https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login

```bash
heroku login
```

### 3. Crear app

```bash
cd server
heroku create tu-app-nombre
```

### 4. Agregar MongoDB Atlas

```bash
heroku addons:create mongolab:sandbox
```

### 5. Configurar variables

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=tu-secret-key
```

### 6. Deploy

```bash
git push heroku main
```

## GitHub Actions (CI/CD)

### Archivo: .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: vercel/action@master
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Docker Deployment

### Build imagen

```bash
docker build -t jaboncontrol:latest .
```

### Run container

```bash
docker run -p 5173:5173 jaboncontrol:latest
```

### Con Docker Compose

```bash
docker-compose up -d
```

## AWS Amplify

### 1. Conectar repositorio

```bash
npm install -g @aws-amplify/cli
amplify configure
```

### 2. Inicializar

```bash
amplify init
amplify hosting add
```

### 3. Deploy

```bash
amplify publish
```

## Netlify

### 1. Conectar GitHub

- Ir a https://netlify.com
- Click "New site from Git"
- Seleccionar repositorio
- Build command: `npm run build`
- Publish directory: `dist`

### 2. Deploy

Netlify automáticamente despliega en cada push

## Optimizaciones Pre-Deploy

### 1. Build size

```bash
npm run build
# Ver tamaño
ls -lh dist/
```

### 2. Performance

```bash
npm install -D lighthouse
lighthouse https://tu-app.com
```

### 3. Security

```bash
npm audit
npm audit fix
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://api.jaboncontrol.com
VITE_AUTH0_DOMAIN=tu-domain.auth0.com
VITE_AUTH0_CLIENT_ID=tu-client-id
```

### Backend (.env)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jaboncontrol
NODE_ENV=production
JWT_SECRET=tu-secret-key
CORS_ORIGIN=https://jaboncontrol.com
PORT=3000
```

## Checklist Pre-Launch

- [ ] Build sin errores
- [ ] No hay console warnings
- [ ] Tests pasan
- [ ] Lighthouse score > 90
- [ ] HTTPS configurado
- [ ] CORS correcto
- [ ] Environment variables configuradas
- [ ] Database migraciones ejecutadas
- [ ] Backups configurados
- [ ] Monitoring activado
- [ ] Error tracking (Sentry) configurado
- [ ] Analytics configurado

## Monitoreo en Producción

### Sentry (Error tracking)

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxx@sentry.io/xxx",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

### Vercel Analytics

Automático en Vercel

### Google Analytics

```bash
npm install react-ga4
```

## Rollback

### Vercel
```bash
vercel rollback
```

### Heroku
```bash
heroku releases
heroku rollback v4
```

### Docker
```bash
docker run -p 5173:5173 jaboncontrol:v1.0
```

## Problemas Comunes

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build falla
```bash
npm run build -- --debug
```

### CORS error
- Verificar VITE_API_URL
- Verificar CORS en backend
- Verificar headers

### Database connection
```bash
# Verificar conexión MongoDB
mongosh "mongodb+srv://user:pass@cluster.mongodb.net"
```

---

¡Tu aplicación está lista para el mundo! 🎉
