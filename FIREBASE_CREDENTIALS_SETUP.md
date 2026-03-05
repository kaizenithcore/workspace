# Configuración de Credenciales Firebase para Localhost

Para simular el entorno de producción en localhost y eliminar los errores de credenciales de Firebase Admin, necesitas configurar las credenciales del service account.

## Problema Actual

Sin credenciales configuradas, Firebase Admin SDK intenta cargar Application Default Credentials (ADC) en cada solicitud, lo que causa:
- ⏱️ Demoras de 5-8 segundos en cada llamada API
- ❌ Errores repetidos: "Could not load the default credentials"
- 🐛 Mensajes de source map inválidos

## Solución: Configurar Service Account

### Paso 1: Obtener las Credenciales

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** (⚙️ arriba a la izquierda)
4. Selecciona la pestaña **Service Accounts**
5. Haz clic en **Generate New Private Key**
6. Descarga el archivo JSON

### Paso 2: Configurar en .env.local

Abre tu archivo `.env.local` y añade la variable `FIREBASE_SERVICE_ACCOUNT`:

```bash
# Firebase Service Account (para simular producción en localhost)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"tu-proyecto-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@tu-proyecto-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-...%40tu-proyecto-id.iam.gserviceaccount.com"}'
```

⚠️ **IMPORTANTE**: 
- El JSON debe estar en **una sola línea** entre comillas simples
- **NO subas este archivo a Git** (ya está en `.gitignore`)
- Los saltos de línea en `private_key` deben ser literales: `\n` (no saltos de línea reales)

### Paso 3: Reiniciar el Servidor

Después de añadir la variable, reinicia el servidor de desarrollo:

```bash
# Detén el servidor actual (Ctrl+C)
# Luego reinicia
pnpm dev
```

## Verificación

Deberías ver este mensaje en la consola al iniciar:

```
[Firebase Admin] Initialized with service account from env
```

En lugar de:

```
[Firebase Admin] No credentials available. To simulate production, add FIREBASE_SERVICE_ACCOUNT to .env.local
```

## Resultado Esperado

✅ **Antes**: `/api/stripe/check-subscription` tarda 5-8 segundos  
✅ **Después**: `/api/stripe/check-subscription` responde en < 500ms

✅ **Antes**: Múltiples errores de credenciales en la consola  
✅ **Después**: Sin errores de credenciales, funcionamiento real de producción

## Alternativa: Usar Firebase CLI

Si prefieres no copiar las credenciales directamente:

```bash
# Autenticar con Firebase CLI
firebase login

# Configurar gcloud (si usas Google Cloud)
gcloud auth application-default login
```

Esto configurará las Application Default Credentials automáticamente, pero puede seguir causando ligeros retrasos en la primera llamada.

## Seguridad

🔒 **Nunca compartas o subas tus credenciales**:

1. Asegúrate de que `.env.local` está en `.gitignore`
2. No incluyas las credenciales en screenshots o logs
3. Si accidentalmente las expones, **regenera inmediatamente una nueva clave** en Firebase Console

## Troubleshooting

### "Error: Failed to parse private key"

- Verifica que el JSON esté en una sola línea
- Asegúrate de que las `\n` en private_key sean literales (no saltos de línea reales)
- Usa comillas simples `'...'` alrededor del JSON

### Sigue viendo errores después de configurar

1. Verifica que reiniciaste el servidor completamente
2. Revisa que el `project_id` coincida con `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. Verifica que la cuenta de servicio tenga los permisos necesarios en Firebase

### Los errores de source map persisten

Los errores de source map son **warnings de desarrollo** y no afectan la funcionalidad. Son causados por las dependencias de Google Cloud y OpenTelemetry. Puedes ignorarlos o deshabilitarlos con:

```js
// next.config.mjs
export default {
  productionBrowserSourceMaps: false,
}
```
