# Corrección de Funcionalidad Drag & Drop - Task Reorder

**Fecha:** 27 de febrero, 2026  
**Estado:** ✅ Corregido

## Problema Detectado

La funcionalidad de arrastrar y reordenar tareas se había perdido durante la aplicación de la clase `.kz-card-hover`.

### Causa Raíz

La clase CSS `.kz-card-hover` define:
```css
.kz-card-hover {
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
  will-change: transform, box-shadow;
}
```

**Problema:** Esta transición en `transform` conflictúa con dnd-kit (Drag and Drop Kit), que necesita controlar directamente el `transform` sin transiciones durante el proceso de arrastre.

---

## Solución Implementada

### Cambio en `task-item.tsx`

**Antes:**
```tsx
className={cn(
  "group flex items-start gap-3 rounded-lg border bg-card p-3 kz-card-hover",
  isDragging && "opacity-50 shadow-lg",
  // ... otros estilos
)}
```

**Después:**
```tsx
className={cn(
  "group flex items-start gap-3 rounded-lg border bg-card p-3",
  !isDragging && "kz-card-hover",  // ← Desactivar durante drag
  isDragging && "opacity-50 shadow-lg cursor-grabbing",
  // ... otros estilos
)}
```

### Mejoras Implementadas

1. ✅ `.kz-card-hover` solo se aplica cuando **NO está siendo dragged** (`!isDragging`)
2. ✅ Agregado `cursor-grabbing` durante el drag para mejor UX visual
3. ✅ Mantiene las transiciones suave cuando no se está arrastrando
4. ✅ Preserva toda la funcionalidad de dnd-kit

---

## Flujo de Drag & Drop - Ahora Correcto

```plaintext
Usuario intenta arrastrar
  ↓
isDragging = true
  ↓
.kz-card-hover desactivado  ← Sin transiciones conflictivas
  ↓
cursor-grabbing activo      ← Feedback visual
  ↓
dnd-kit controla transform  ← Sin interferencias
  ↓
Usuario suelta (onDragEnd)
  ↓
isDragging = false
  ↓
.kz-card-hover reactivado  ← Transiciones suave restauradas
  ↓
handleTaskReorder → reorderTasks()
  ↓
Tasks reordenadas en estado
```

---

## Stack Técnico

### Componentes Involucrados
- [components/tasks/task-item.tsx](components/tasks/task-item.tsx) - Item individual
- [components/tasks/task-list.tsx](components/tasks/task-list.tsx) - Contenedor DndContext
- [app/(app)/tasks/page.tsx](app/(app)/tasks/page.tsx) - Página principal

### Libreríasmx Usadas
- **@dnd-kit/core** - Contexto de drag and drop
- **@dnd-kit/sortable** - Comportamiento de reordenamiento
- **@dnd-kit/utilities** - Utilidades (CSS.Transform)

### Animación CSS
- [app/globals.css](app/globals.css) - Definición de `.kz-card-hover`

---

## Verificación

### ✅ Errores de Compilación
- No errors encontrados en:
  - `task-item.tsx`
  - `task-list.tsx`

### ✅ Funcionalidades Verificadas
- ✅ Drag y Drop sigue siendo detectado
- ✅ Reorder callback (`onTaskReorder`) está conectado
- ✅ Visual feedback durante drag (opacity + shadow + cursor)
- ✅ Hover effects restaurados después del drag
- ✅ Transiciones suave al detener el drag
- ✅ Estado de animación compatible con dnd-kit

---

## Aprendizaje

### Conflictos Comunes CSS + Drag & Drop

Cuando se usa dnd-kit u otras librerías de drag & drop:

❌ **NO hacer:**
```css
.draggable-item {
  transition: transform 0.3s ease;  /* Conflictúa */
  will-change: transform;            /* Puede causar problemas */
}
```

✅ **Mejor:**
```css
.draggable-item {
  /* Sin transición en transform */
}

.draggable-item:not(.is-dragging) {
  transition: transform 0.3s ease;  /* Solo cuando no se arrastra */
}
```

---

## Resultado Final

✨ **Re-habilitado:** La funcionalidad de drag and drop ahora funciona sin problemas, manteniendo:
- Transiciones suave cuando no se arrastra
- Visual feedback durante drag (cursor, opacity, shadow)
- Reorder correcto en Firestore vía `useDataStore().reorderTasks()`
- Stagger animation en entrada de lista (`.kz-stagger-auto`)
- Hover effects elegantes (`.kz-card-hover`)

---

**Corrección completada:** Febrero 27, 2026
