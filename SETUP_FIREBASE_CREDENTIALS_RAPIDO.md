# 🚀 Configuración Rápida de Credenciales Firebase

## El Problema

Ves este error: `[Stripe] Admin unavailable in check-subscription route`

**Ahora tu app funciona parcialmente:**
- ✅ **Muestra correctamente** tu plan PRO en la UI (consultando Stripe)
- ❌ **NO actualiza Firebase** con los datos de Stripe
- ❌ Firebase sigue mostrando `plan: free`, `status: inactive`

## La Solución (5 minutos)

### 1. Obtener las Credenciales

Ve a: [Firebase Console → Service Accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk)

1. Selecciona tu proyecto
2. Click en **"Generate New Private Key"**
3. Click en **"Generate Key"** (descarga un archivo JSON)

### 2. Formato del JSON

Abre el archivo descargado. Debe verse así:

```json
{
  "type": "service_account",
  "project_id": "tu-proyecto-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@tu-proyecto.iam.gserviceaccount.com",
  "client_id": "1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 3. Añadir a .env.local

**IMPORTANTE:** El JSON debe estar en **UNA SOLA LÍNEA** entre comillas simples.

Copia TODO el contenido del archivo JSON y añádelo a tu `.env.local`:

```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"tu-proyecto-id","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@tu-proyecto.iam.gserviceaccount.com","client_id":"1234567890","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}'
```

**Nota:** Los `\n` en `private_key` son LITERALES (no saltos de línea reales).

### 4. Convertir JSON a una línea (Método Fácil)

**Windows PowerShell:**
```powershell
$json = Get-Content .\tu-archivo-firebase.json -Raw
$oneLine = $json -replace "`r`n", "" -replace "`n", ""
"FIREBASE_SERVICE_ACCOUNT='$oneLine'" | Out-File -Append .env.local -Encoding utf8
```

**Mac/Linux:**
```bash
echo "FIREBASE_SERVICE_ACCOUNT='$(cat tu-archivo-firebase.json | tr -d '\n')'" >> .env.local
```

**Online (Copiar/Pegar):**

1. Ve a: https://www.text-utils.com/json-formatter/
2. Pega tu JSON
3. Selecciona "Minify" (compactar)
4. Copia el resultado
5. Pega en `.env.local` como: `FIREBASE_SERVICE_ACCOUNT='...aquí...'`

### 5. Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C en la terminal)
pnpm dev
```

## Verificación

Después de reiniciar, deberías ver:

```
[Firebase Admin] Initialized with service account from env
```

En lugar de:

```
[Firebase Admin] No credentials available...
```

Luego recarga `/settings` y verás:

```
[Stripe] Searching for customer by email fallback: tu-email@ejemplo.com
[Stripe] Found 1 customer(s) for email tu-email@ejemplo.com
[Stripe] Reconciling data discrepancy for user xxx...
[Stripe] ✓ Successfully reconciled Firebase data for user xxx
```

## ¿Funcionará sin esto?

**Parcialmente SÍ** (después de mis últimos cambios):
- ✅ Tu app MUESTRA correctamente el plan PRO en la UI
- ✅ Stripe es la fuente de verdad
- ❌ Firebase NO se sincronizará (seguirá mostrando free/inactive)
- ❌ El webhook NO podrá actualizar usuarios en el futuro

**Para producción NECESITAS las credenciales** para que todo funcione correctamente.

## Seguridad

⚠️ **NUNCA subas .env.local a Git** (ya está en .gitignore)  
⚠️ Si expones las credenciales, **regenera inmediatamente** una nueva clave en Firebase Console
