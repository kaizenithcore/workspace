# Firebase Admin Credentials en Coolify - Guía de Configuración

## Problema Diagnosticado

El error `Failed to parse private key: Error: Invalid PEM formatted message` ocurre porque la clave privada de Firebase no se está formateando correctamente en el entorno Coolify/Docker.

## Soluciones por Formato de Clave

### ✓ Opción 1: Variables con Escapes Literales (RECOMENDADO)

En Coolify, en la sección de **Environment Variables**, configura:

```
FIREBASE_PROJECT_ID=focustracker-kaizenith
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@focustracker-kaizenith.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDhnHQyVyv/+Mvg\nZd+BcspEDKMMvRuQtbY/POSoKFTq3jrhq5BvPNU7xzNfruNU76UyMYOprRbS2LxG\n2Bj1+i4grOSdN+HDV7CP+IONO7Nfr+YRONjHRLf/57Z9lpXdt8/XMzCdPtbpVU5X\nDs2qAo5zWV7s3P7Y56GAL/tr3otFb3y2hFpu+zVNyCc9M5Q2rcx+K2anyiS14x8x\nzqWfdmDHJ9FjuwPwwV4Pn1FXkR1XKnm/zf8gV1eZoapXw7GTJocytbWtP50V0rcJ\nUnUj9MpaYdhuwyRiph4BrCriKa1kohP+Q8id/iyRpZ0hP7vsglp3SLzD8jnfSn+f\nWJ9nKE5xAgMBAAECggEAF95bBrZlP8v9Gcz9U+8migOCPodFQs6OrOsOz+GQdlaz\niQuDGNmpP41IGJ/iiipeYkyNvuZCi2UFqkMThPaGacuQ1jdCyc1dryWeGVOPGxj7\ncKgAeziAdPD5RBkp2s6nDP/r7T7oMsBlLN2ykYF6u6ZhXhLVXXJICk1JPrTJLDu3\n6mE3+WByrmmQGc+PoryG8bs2wgMN+YprL2XTRUNN6UfHBv33ZAQPuPG8ZO5L0dUu\nzUcmU2nN4ShutQgiWcHhIOi4p7iHzHUE1geiY8ql5De1Is2lBQlcv4EF5gkszKQT\n9OrFEwlwj5JgiRZNMWO6yRLVg+OidHl2hRuNeRYxfwKBgQD2fE2P67Mqm/rS7RFf\nsdn0oTHCCTbiFydnutc5o2hJ8pXLYiHdpwIABu+XCvwgibjzcDnJHWAMs0pYyKlx\ngPITp1F4HP1whx7a2OMlQW4Jy+3iLUIZJp4g5FtlTEooVAvKR5rgC23fBE7U/KDO\noq0u42xKSxE6PcUKeftLeo5pAwKBgQDqUeBOZTYO+5BHLGMPmqk1unJz7d9gNazU\nJD3v3g2Q2uVFihTTI9SIjLQI/h2EOnTE0lJ8U9uSWHl6AjHig6iFPO/9FL812ASw\nv5oIs52Gwn27tyC4bgc4qA8gtQ0bNzZS1V7l9UsIhpDpbgJ6LSpcmVutgKU+6VtB\neIK6HqSeewKBgBj8ApSrDI8uHl+Q/ijYC0K7sCJ98p06QZlHHBfQk3qjZ0GlYc9o\n5VABY/nIeEQIEcJDRug23QyMg+W5+UrzChap6B0nuxzT5XHDeErHdhLyI9vAQKnx\n+ydUXltHP2EVG9jWJ0G8hteLRT5bmSU44hsVnF1vfICN0FI+iRVeh97nAoGBAIgr\nHoPQU1LvpA+IXuThhvW/LOXr1USuzInXqdqsGwwT+OqpbKKqjsbvpWwYaITAB72d\nT+wKO25XVfiuL9knk5YiLIDRPrEGoOsp3VSzNJbsjW655Bzpa+7j0y65qC0pr7sB\nXg2at4jz0mCk2nGvr49yW5F/Ugg2Sh7I7odEaXvjAoGAZq5wawq/OC76wq4qdIOs\n3aZBOWSOtYWL9QPHTSmOQVaPBHFt6yXa9fuVsNuDXHUf+mul3jbhQ0cDgiiqdE2N\nbskqW6GwZ3CCOUR95N5acNeecSxb5SU/5JZFj5p1KPPBw/6zbxXjFNz3gB/y9uJd\n7kMNpPoApxDaDOdcYMSNTRg=\n-----END PRIVATE KEY-----
```

**IMPORTANTE:** 
- Los `\n` deben ser **caracteres literales** (backslash + n), NO saltos de línea reales
- Si copias desde el .env.local, debería funcionar directamente

### ✓ Opción 2: Variable Multiline (Si Coolify lo permite)

Algunos sistemas permiten variables multiline. Si Coolify tiene un editor especial para variables, puedes intentar:

```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDhnHQyVyv/+Mvg
Zd+BcspEDKMMvRuQtbY/POSoKFTq3jrhq5BvPNU7xzNfruNU76UyMYOprRbS2LxG
...
-----END PRIVATE KEY-----"
```

En este caso, nuestro código de actualizado detectará y procesará los saltos de línea reales.

## Diagnosar el Problema

Ejecuta el script de validación en producción:

```bash
# En tu servidor Coolify, conecta via SSH y ejecuta:
cd /your/app/directory
npm run validate-firebase-credentials
```

Este script te dirá exactamente en qué formato está recibiendo Coolify la clave privada.

## Pasos de Implementación

1. **Backup de tu configuración actual en Coolify**
   - Captura una screenshot de tus variables de entorno

2. **Actualizar el código**
   - Mi actualización a `lib/firebase-admin.ts` es más robusta y mejor informada
   - Incluye validación de formato de clave

3. **Validar en producción**
   - Despliega el nuevo código
   - Ejecuta: `npm run validate-firebase-credentials`
   - Verifica que la salida sea ✓

4. **Prueba la funcionalidad**
   - Intenta crear una nueva tarea

## Mensajes de Error Mejorados

Con mi actualización, ahora obtendrás mensajes más específicos:

```
[Firebase Admin] Private key parsing failed: Invalid PEM formatted message
[Firebase Admin] Private key length: 1234
[Firebase Admin] First 50 chars: -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgk
```

Esto te ayudará a diagnosticar exactamente qué está mal.

## Alternativa: Usar Application Default Credentials (ADC)

Si tienes acceso a GCP y prefieres NO almacenar la clave privada en variables de entorno:

1. En Coolify, genera una key JSON desde Google Cloud Console
2. Monta ese archivo en el contenedor Docker
3. Usa `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`

El código ya tiene soporte para esto (fallback a ADC).

## Archivos Modificados

- `lib/firebase-admin.ts` - Mejor parseado y validación de errores
- `scripts/validate-firebase-credentials.ts` - Script de diagnóstico

## Próximos Pasos

1. Lee el formato actual de tu variable en Coolify
2. Si es diferente a lo que espera, usa el script de validación
3. Actualiza según lo que el script te indique
4. Despliega y prueba
