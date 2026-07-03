// Este tipo agrupa todos los datos principales que viven en el contexto de la app.
interface BackupData {
  ventas: any[];
  cobros: any[];
  clientes: any[];
  hornadas: any[];
  recepciones: any[];
  proyectos: any[];
  equipos: any[];
  documentos: any[];
}

// Genera y descarga un backup completo sin depender de librerias Excel vulnerables.
export function exportFullBackup(data: BackupData) {
  // La fecha en el nombre evita pisar backups anteriores.
  const today = new Date().toISOString().slice(0, 10);

  // Guardamos tambien metadatos para saber de donde salio el respaldo.
  const payload = {
    app: 'JabonControl',
    version: 2,
    generadoEn: new Date().toISOString(),
    modulos: data,
  };

  // Blob crea un archivo local descargable desde el navegador.
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });

  // URL temporal para que el navegador pueda descargar el archivo.
  const url = URL.createObjectURL(blob);

  // Link invisible usado solo para disparar la descarga.
  const link = document.createElement('a');
  link.href = url;
  link.download = `JabonControl_backup_${today}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Liberamos memoria del objeto temporal.
  URL.revokeObjectURL(url);
}
