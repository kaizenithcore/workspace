# Notebook Feature - Troubleshooting Guide

## Problema: "Notebook not found" al abrir notebooks

### ✅ Solución Implementada
El error se debía a que en Next.js 15+, `params` es una Promise que debe ser unwrapped con `React.use()`.

**Archivo corregido**: `app/(app)/notebooks/[id]/page.tsx`

```typescript
// ❌ ANTES (causaba el error)
export default function NotebookViewPage({ params }: NotebookViewProps) {
  const { notebook } = useNotebook(user?.uid, params.id)
}

// ✅ DESPUÉS (correcto)
import { use } from "react"
export default function NotebookViewPage({ params }: NotebookViewProps) {
  const resolvedParams = use(params)
  const notebookId = resolvedParams.id
  const { notebook } = useNotebook(user?.uid, notebookId)
}
```

---

## Problema: Los notebooks no se guardan en Firebase

### Verificaciones a realizar:

#### 1. **Verificar autenticación**
Abre la consola del navegador (F12) y verifica que hay un usuario autenticado:

```javascript
// En la consola del navegador
firebase.auth().currentUser
```

Si es `null`, necesitas iniciar sesión primero.

#### 2. **Verificar logs de creación**
Al crear un notebook, deberías ver estos logs en la consola:

```
[createNotebook] Creating notebook for user: <userId>
[createNotebook] Notebook data: { title: "...", ownerId: "...", ... }
[createNotebook] Document to save: { ... }
[createNotebook] Notebook created successfully with ID: <notebookId>
```

Si ves un error en lugar de "created successfully", el problema está en:
- **Permisos de Firestore** (ver punto 3)
- **Configuración de Firebase** (ver punto 4)

#### 3. **Verificar reglas de Firestore**
Las reglas deben permitir la creación de notebooks. Ejecuta este comando para desplegar las reglas:

```bash
firebase deploy --only firestore:rules
```

**Reglas necesarias** (ya están en `firestore.rules`):
```javascript
match /users/{userId}/notebooks/{notebookId} {
  allow read: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId 
                && request.resource.data.ownerId == request.auth.uid;
  allow update: if request.auth.uid == userId 
                && resource.data.ownerId == request.auth.uid;
  allow delete: if request.auth.uid == userId;
}
```

#### 4. **Verificar configuración de Firebase**
Asegúrate de que el archivo `.env.local` tiene todas las variables correctas:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

#### 5. **NO crees colecciones manualmente en Firebase**
⚠️ **IMPORTANTE**: No es necesario crear la colección `notebooks` manualmente en Firebase Console. Firestore crea las colecciones automáticamente cuando insertas el primer documento.

Si ya creaste una colección manualmente con un ID de usuario como documento, **elimínala**:
1. Ve a Firebase Console > Firestore Database
2. Si ves algo como: `notebooks` > `<userId>` (documento)
3. **Elimínalo** - la estructura correcta es: `users/{userId}/notebooks/{notebookId}`

#### 6. **Estructura correcta en Firestore**
La estructura debe verse así en Firebase Console:

```
users/
  └─ <userId>/
      └─ notebooks/
          └─ <notebookId>/
              ├─ title: "Mi Notebook"
              ├─ ownerId: "<userId>"
              ├─ userId: "<userId>"
              ├─ pageCount: 0
              ├─ createdAt: timestamp
              └─ updatedAt: timestamp
              └─ pages/
                  └─ <pageId>/
                      ├─ title: "Page 1"
                      ├─ content: "..."
                      └─ ...
```

---

## Comandos útiles para debugging

### Verificar la consola del navegador
1. Abre la consola (F12)
2. Ve a la pestaña "Console"
3. Crea un notebook
4. Busca los logs `[createNotebook]`

### Ver errores de Firestore
```javascript
// En la consola del navegador
// Esto mostrará cualquier error de permisos
```

Los errores de permisos típicos:
- `Missing or insufficient permissions` → Problema con las reglas de Firestore
- `PERMISSION_DENIED` → El usuario no está autenticado o las reglas bloquean la operación

---

## Pasos de resolución rápida

1. ✅ **Asegúrate de estar autenticado** como usuario
2. ✅ **Despliega las reglas de Firestore**: `firebase deploy --only firestore:rules`
3. ✅ **Elimina cualquier colección `notebooks` creada manualmente** en Firebase Console
4. ✅ **Reinicia el servidor de desarrollo**: `pnpm dev`
5. ✅ **Crea un nuevo notebook** y observa los logs en la consola
6. ✅ **Verifica en Firebase Console** que el documento se creó en `users/<userId>/notebooks/<notebookId>`

---

## Si el problema persiste

Comparte en consola:
1. Los logs de `[createNotebook]`
2. Cualquier error en rojo en la consola del navegador
3. El `userId` del usuario autenticado
4. La estructura que ves en Firebase Console bajo `users/`

Esto ayudará a diagnosticar el problema específico.
