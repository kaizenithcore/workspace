# Solución: Firebase Admin PEM Parsing Error en Coolify

## Problema Detectado

En producción (Coolify), al intentar crear una tarea, obtenías:
```
POST https://workspace.kaizenith.es/api/tasks/validate 500 (Internal Server Error)
Failed to parse private key: Error: Invalid PEM formatted message
```

**Causa:** La clave privada de Firebase (`FIREBASE_PRIVATE_KEY`) con escapes literales `\n` no se estaba parseando correctamente, posiblemente por:
1. Escapes dobles (`\\n` en lugar de `\n`) en la variable de entorno
2. Falta de validación robusta en el parseado

## Soluciones Implementadas

### 1. **Parseado Mejorado de Claves Privadas**
**Archivo:** `lib/firebase-admin.ts`

`parsePrivateKey()` ahora:
- Detecta y maneja escapes simples (`\n`) y dobles (`\\n`)
- Valida que la clave tenga headers y footers PEM válidos
- Mensajes de error más específicos para diagnóstico

```typescript
// Maneja: -----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----
// Maneja: -----BEGIN PRIVATE KEY-----\\nMIIEv...\\n-----END PRIVATE KEY-----
```

### 2. **Sistema de Errores Consistente**
**Archivo:** `lib/firebase-admin-errors.ts` (NUEVO)

Nuevas funciones helper:
- `isFirebaseCredentialError()` - Detecta errores de credentials
- `logFirebaseCredentialError()` - Logging consistente con debugging
- `handleFirebaseAdminError()` - Respuesta uniforme para endpoints

### 3. **Endpoints Mejorados**
Todos estos ahora tienen mejor error handling:
- `/api/tasks/validate` ✓
- `/api/stripe/webhook` ✓
- `/api/stripe/check-subscription` ✓
- `/api/stripe/create-checkout-session` ✓
- `/api/stripe/create-billing-portal` ✓

### 4. **Script de Diagnóstico**
**Archivo:** `scripts/validate-firebase-credentials.ts` (NUEVO)

Ejecuta en tu servidor:
```bash
npm run validate-firebase-credentials
```

Te dirá:
- ✓ Si las variables están configuradas
- ✓ El formato exacto de la clave (con escapes, multiline, etc.)
- ✓ Si el parseado funciona
- ✓ Sugerencias para arreglarlo

## Qué Cambió Exactamente en Coolify

Tu variable `FIREBASE_PRIVATE_KEY` existe en Coolify con este formato:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n
```

**Antes:** Solo hacía `replace(/\\n/g, "\n")` - esto funciona si la variable tiene `\n` literales

**Ahora:** 
1. Primero intenta detectar `\\n` (doble escape) y convertir a `\n`
2. Luego convierte `\n` a saltos de línea reales
3. Valida que el resultado sea una clave PEM válida
4. Da mejor feedback si algo falla

## Cómo Verificar Que Funciona

1. **Despliega el nuevo código a producción**

2. **Ejecuta el diagnóstico** vía SSH en tu servidor:
   ```bash
   cd /your/app/directory
   npm run validate-firebase-credentials
   ```

   Debería ver:
   ```
   === Firebase Credentials Validation ===
   ✓ FIREBASE_PROJECT_ID: ✓ Set
   ✓ FIREBASE_CLIENT_EMAIL: ✓ Set
   ✓ FIREBASE_PRIVATE_KEY: ✓ Set
   
   === Private Key Analysis ===
   Length: 1704
   
   PEM Headers:
   ✓ Has BEGIN header: true
   ✓ Has END footer: true
   
   === Parse Attempt ===
   ✓ Parsing successful!
   ✓ Firebase Admin credential created successfully!
   ✓ All checks passed! Firebase credentials are valid.
   ```

3. **Prueba crear una tarea** en tu app
   - Deberías poder crearla sin errores 500
   - Si hay error, los logs ahora dirán exactamente qué está mal

## Si Aún Tienes Problemas

Si al ejecutar el script ves errores como:
```
✗ Parsing failed: Invalid private key format: missing or malformed PEM header
✗ Key must contain '-----BEGIN PRIVATE KEY-----' on a separate line
```

**Opciones:**

### Opción A: Verificar Format en Coolify (Recomendado)
En el panel de Coolify:
1. Ve a Environment Variables
2. Copia el valor exacto de `FIREBASE_PRIVATE_KEY`
3. Pon el cursor dentro y verifica si ves `\n` como dos caracteres o como saltos de línea reales

Si ves **▼** o **↵** = son saltos de línea reales (OK)
Si ves `\n` como texto = son escapes literales (OK, código maneja esto)

### Opción B: Regenerar la Variable
Si la variable está corrupta:
1. Abre tu archivo `.env.local` en desarrollo
2. Copia el valor completo de `FIREBASE_PRIVATE_KEY`
3. Ve a Coolify y reemplaza el valor entero

### Opción C: Usar Archivo en lugar de Variable
Si tienes acceso a GCP y mucho lío con las variables:
1. Descarga la key JSON desde Google Cloud Console
2. Monta el archivo en el contenedor:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-key.json
   ```
3. Colloca el archivo `firebase-key.json` en el contenedor
4. El código tiene soporte automático para esto

## Monitoreo Continuo

Ahora cuando ocurran errores de Firebase Admin, los logs dirán:

```
[Firebase Admin] ⚠️ CREDENTIAL CONFIGURATION ERROR
[Firebase Admin] This is likely due to FIREBASE_PRIVATE_KEY misconfiguration

[Firebase Admin] Troubleshooting steps:
[Firebase Admin] 1. Check that FIREBASE_PRIVATE_KEY is set in environment variables
[Firebase Admin] 2. The key should contain literal \n (backslash-n), not actual newlines
[Firebase Admin] 3. Alternative: Use actual multiline newlines in Coolify if supported
[Firebase Admin] 4. Run 'npm run validate-firebase-credentials' to diagnose
```

Mucho más útil que "Invalid PEM formatted message" 😄

## Resumen del Fix

| Aspecto | Antes | Después |
|--------|-------|--------|
| **Parseado** | Solo `\n` simple | Detecta `\\n` y `\n` |
| **Validación** | Sin validación PEM | Verifica headers/footers |
| **Errores** | Genéricos | Específicos con debugging |
| **Logging** | Mínimo | Detallado |
| **Endpoints** | Sin manejo especial | Consistente en todos |
| **Diagnóstico** | Manual | Script automatizado |
