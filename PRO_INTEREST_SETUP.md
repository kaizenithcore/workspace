# Pro Interest Form - Setup & Debugging

## Variables de Entorno

En tu archivo `.env.local` necesitas estas variables:

```env
MAILCHIMP_PRO_API_KEY=tu-api-key
MAILCHIMP_PRO_LIST_ID=tu-list-id
MAILCHIMP_PRO_DC=us20
```

### Cómo obtenerlas de Mailchimp:

1. **API Key**: Mailchimp → Account → Extras → API Keys → Create A Key
2. **List ID**: Mailchimp → Audience → Settings → Audience name and defaults → Audience ID
3. **DC (Data Center)**: Mira el final de tu URL de Mailchimp (ejemplo: `us20.admin.mailchimp.com` → `us20`)

## Reglas de Firestore

**IMPORTANTE**: Debes desplegar las reglas actualizadas de Firestore:

```bash
firebase deploy --only firestore:rules
```

Las reglas actualizadas permiten que los usuarios actualicen su propio documento en `/users/{userId}`, incluyendo los campos `proInterestSubmitted` y `proInterestSubmittedAt`.

Si no despliegas las reglas, obtendrás errores de permisos al intentar marcar al usuario.

## Arquitectura

1. **Cliente** → envía email a `/api/pro-interest`
2. **Servidor** → envía a Mailchimp y responde success/error
3. **Cliente** → si success, marca en Firestore `proInterestSubmitted: true`

Esto evita problemas de permisos porque Firestore se actualiza desde el cliente autenticado.

## Verificación

### 1. Verifica que las variables están cargadas

Abre la consola del servidor (donde corre `npm run dev`) y busca estos logs al enviar el formulario:

```
[pro-interest] Sending to Mailchimp: { email: '...', tags: [...], dc: 'us20', listId: '...' }
[pro-interest] Mailchimp response: 200 {...}
[pro-interest] Successfully added to Mailchimp
```

Y en la consola del navegador:

```
[ProInterestForm] Marked in Firestore
```

### 2. Si NO ves logs:

- Las variables no están cargadas correctamente
- Reinicia el servidor de desarrollo (`npm run dev`)

### 3. Si ves error 401 (Unauthorized):

```
[pro-interest] Mailchimp response: 401 ...
```

- Tu API key es incorrecta
- Verifica que copiaste la key completa

### 4. Si ves error 404:

```
[pro-interest] Mailchimp response: 404 ...
```

- Tu List ID es incorrecto
- O el DC (data center) no coincide

### 5. Si ves error 400 "Invalid Resource":

- Verifica que las tags sean válidas
- Verifica que el formato del email sea correcto

## Debugging en el navegador

Abre las DevTools del navegador (F12) y:

1. Ve a la pestaña **Network**
2. Envía el formulario
3. Busca la petición a `/api/pro-interest`
4. Verifica:
   - Status code (debe ser 200)
   - Response body: `{ "success": true }`

## Estado en Firestore

Después de enviar el formulario, el usuario debe tener estos campos:

```json
{
  "proInterestSubmitted": true,
  "proInterestSubmittedAt": Timestamp
}
```

Verifica en Firebase Console → Firestore → users → [tu-uid]

## Tags en Mailchimp

El contacto debe tener estos tags:

- `kaizenith`
- `pro-interest`
- `context:dashboard` (o el location que especificaste)

## Troubleshooting

### El formulario dice "success" pero no aparece en Mailchimp

1. Verifica los logs del servidor (paso 1)
2. Si ves "dev mode" → las env vars no están cargadas
3. Si no ves logs → el endpoint no se está llamando (verifica Network tab)

### El email se envía dos veces sin error

- Antes no estadesplegaste las reglas de Firestore: `firebase deploy --only firestore:rules`
- Verifica que `user?.uid` esté disponible (usuario autenticado)
- Verifica los logs del navegador: `[ProInterestForm] Marked in Firestore`
- Si ves "permission-denied", las reglas no están desplegadas correctamente"

### El usuario no se marca en Firestore

- Verifica que `user?.uid` esté disponible
- Si el usuario no está autenticado, no se marcará (pero sí se enviará a Mailchimp)
- Verifica los logs: `[pro-interest] Marked user in Firestore: uid-xxx`

## Probar localmente

1. Asegúrate de tener un usuario autenticado
2. Ve al Dashboard
3. Completa el formulario Pro Interest
4. Verifica:
   - Logs del servidor
   - Network tab (status 200)
   - Mailchimp audience (nuevo contacto)
   - Firestore (campo `proInterestSubmitted: true`)
5. Recarga la página → debe mostrar mensaje de éxito sin formulario

## Producción

Recuerda agregar las mismas variables de entorno en tu plataforma de deployment (Vercel, etc.)
