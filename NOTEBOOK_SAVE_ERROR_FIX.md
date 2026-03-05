# Solución: Error "Missing or insufficient permissions" al guardar cuadernos

## Problemas Corregidos ✅

### 1. Falta de `ownerId` en notebooks
**Problema**: La función `createNotebook()` en `lib/firestore-notebooks.ts` no agregaba el campo `ownerId` requerido por las reglas de Firestore.

**Solución**: Agregado `ownerId: userId` en línea 70:
```javascript
const notebookDoc = {
  ...notebookData,
  userId,
  ownerId: userId,  // ← AGREGADO
  pageCount: 0,
  ...
}
```

**Por qué**: Las reglas de Firestore requieren que todos los notebooks tengan `ownerId` para poder crear y actualizar:
```javascript
allow create: if request.auth.uid == userId && request.resource.data.ownerId == request.auth.uid;
allow update: if request.auth.uid == userId && resource.data.ownerId == request.auth.uid;
```

### 2. Reglas de Firestore mejoradas
Se agregó soporte para la colección `notebook_search` que se usa en la indexación de búsqueda.

---

## Error: `ERR_BLOCKED_BY_CLIENT`

Este error significa que el navegador está **bloqueando las solicitudes POST a Firestore**. Las causas comunes son:

### ✅ Soluciones Recomendadas

#### 1. **Desactiva extensiones/adblockers**
- Desactiva extensiones como Adblock, uBlock Origin, Privacy Badger
- Especialmente aquellas que bloquean trackers o dominios de Google
- Firestore usa `firestore.googleapis.com` que puede estar en listas de bloqueo

#### 2. **Limpia caché y cookies del navegador**
```
Chrome/Edge: Ctrl+Shift+Del → Selecciona "Todos los tiempos" → Borra
```

#### 3. **Verifica la autenticación**
- Abre las DevTools (F12) → Console
- Ejecuta:
```javascript
// Verificar token de auth
const auth = require('firebase/auth');
console.log(auth.currentUser?.getIdToken());
```

#### 4. **Abre una pestaña privada/incógnita**
- Las extensiones no funcionan en modo privado
- Si funciona ahí, definitivamente es una extensión

#### 5. **Usa un navegador diferente**
- Prueba en Firefox, Safari, etc.
- Confirma que es un problema específico del navegador

---

## Verificación de Migración

Si tienes cuadernos existentes sin `ownerId`, ejecuta este script:

```bash
# En Firebase Console → Functions, o ejecuta localmente
npx firebase emulators:start
```

Luego en el Admin SDK:
```typescript
const notebooks = await admin.firestore()
  .collectionGroup('notebooks')
  .where('ownerId', '==', undefined)
  .get();

for (const doc of notebooks.docs) {
  const userId = doc.ref.parent.parent?.id; // Extrae userId de la ruta
  if (userId) {
    await doc.ref.update({ ownerId: userId });
  }
}
```

---

## Para Verificar que Todo Funciona

1. **Crea un notebook nuevo** - Debe guardar sin errores
2. **Edita el contenido** - El autosave debe funcionar
3. **Abre DevTools** (F12):
   - Network tab → Filtra "firestore"
   - Verifica que las solicitudes POST tengan status 200
   - NO deben mostrar "ERR_BLOCKED_BY_CLIENT"

---

## Próximos pasos

Si el error persiste después de limpiar caché y desactivar extensiones:
1. Verifica que el usuario está correctamente autenticado
2. Comprueba que el database ID es correcto: `projects/focustracker-kaizenith/databases/(default)`
3. Revisa los logs en Firebase Console → Cloud Firestore → Registros de auditoría
