const fs = require('fs');
const path = require('path');

// Copia el build de Vite al directorio publico que sirve Express en produccion.
const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'jaboncontrol', 'dist');
const targetDir = path.join(rootDir, 'backend', 'public');

// Si no existe dist, el build frontend fallo antes de llegar aqui.
if (!fs.existsSync(sourceDir)) {
  throw new Error(`No existe el build frontend: ${sourceDir}`);
}

// Reemplazamos public para evitar servir assets viejos.
fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Frontend copiado a ${targetDir}`);
