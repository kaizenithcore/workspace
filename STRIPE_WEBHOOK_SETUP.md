# Configuración de Webhooks de Stripe

## Problema Actual

Si ves que Firebase muestra `plan: free` y `status: inactive` pero tienes una suscripción activa en Stripe, es probable que:

1. ❌ **El webhook de Stripe no está configurado**
2. ❌ **El webhook está configurado pero apunta a una URL incorrecta**
3. ❌ **Los eventos del webhook fallaron**

## Solución Implementada

He mejorado el código para que:

✅ **Stripe siempre prevalece** sobre Firebase como fuente de verdad  
✅ **El check-subscription route reconcilia automáticamente** las discrepancias detectadas  
✅ **Logging expandido** para identificar cuándo ocurre la reconciliación  

Sin embargo, para que funcione automáticamente en el futuro, **necesitas configurar el webhook de Stripe**.

---

## Configurar Webhook de Stripe

### Paso 1: Accede a los Webhooks en Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navega a **Developers** → **Webhooks**
3. Haz clic en **Add endpoint**

### Paso 2: Configura el Endpoint

**URL del Webhook:**
```
https://tu-dominio.com/api/stripe/webhook
```

**Nota:** Reemplaza `tu-dominio.com` con tu dominio de producción (ej: `kaizenith.com`)

**Eventos a escuchar:**

Selecciona los siguientes eventos (o selecciona "Select all checkout events" y "Select all customer events"):

- ✅ `checkout.session.completed` - Cuando el usuario completa el pago
- ✅ `customer.subscription.created` - Cuando se crea una nueva suscripción
- ✅ `customer.subscription.updated` - Cuando cambia la suscripción
- ✅ `customer.subscription.deleted` - Cuando se cancela la suscripción
- ✅ `invoice.payment_succeeded` - Cuando un pago es exitoso
- ✅ `invoice.payment_failed` - Cuando un pago falla

### Paso 3: Obtén el Signing Secret

Después de crear el webhook:

1. Haz clic en el webhook creado
2. Copia el **Signing secret** (comienza con `whsec_...`)
3. Añádelo a tu `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui
```

### Paso 4: Verifica la Configuración

Stripe envía un evento de prueba automáticamente. Verifica que:

1. El estado del webhook muestre **✓ Enabled**
2. Los eventos de prueba muestren **Success (200)**
3. No haya errores en el registro de eventos

---

## Probar el Webhook Localmente

Para probar webhooks en localhost, usa **Stripe CLI**:

### Instalación

```bash
# Windows (con Scoop)
scoop install stripe

# macOS
brew install stripe/stripe-cli/stripe

# O descarga desde: https://github.com/stripe/stripe-cli/releases
```

### Uso

```bash
# Autenticar
stripe login

# Reenviar webhooks a localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Esto te dará un webhook signing secret temporal como:
# whsec_xxxxxxxxxxxxx

# Úsalo en .env.local:
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Probar Evento

En otra terminal:

```bash
# Simular un checkout completado
stripe trigger checkout.session.completed

# Simular una actualización de suscripción
stripe trigger customer.subscription.updated
```

Deberías ver los eventos procesándose en tu terminal y los logs en la consola de tu app.

---

## Reconciliar Suscripciones Existentes (Caso Actual)

Como ya mejoramos el código de `check-subscription`, **la reconciliación ocurrirá automáticamente** la próxima vez que:

1. El usuario visite `/settings` (llamará a check-subscription)
2. El usuario recargue la página
3. Pase la ventana de polling de 30 minutos

**Para forzar la reconciliación inmediata:**

1. Ir a `/settings` en tu app
2. Recargar la página (F5)
3. Verificar la consola del servidor para ver:
   ```
   [Stripe] Reconciling data discrepancy for user xxx: Firebase had plan=free, status=inactive, but Stripe shows active monthly subscription
   [Stripe] ✓ Successfully reconciled Firebase data for user xxx
   ```

Después de esto, Firebase debería mostrar `plan: pro` y `status: active`.

---

## Verificar Estado Actual

### En Stripe Dashboard

1. Ve a **Customers**
2. Busca tu email
3. Verifica que tengas una suscripción con estado **Active**
4. Anota el **Customer ID** (cus_xxx)

### En Firebase Console

1. Ve a **Firestore Database**
2. Abre la colección `users`
3. Busca tu documento de usuario
4. Verifica que `subscription.stripeCustomerId` coincida con el Customer ID de Stripe

Si no coincide o está vacío, el check-subscription route lo corregirá automáticamente.

---

## Logs de Depuración

Después de los cambios, verás logs más detallados:

```
[Stripe] Searching for customer by email fallback: user@example.com
[Stripe] Found 1 customer(s) for email user@example.com
[Stripe] Selected customer cus_xxx with active subscription
[Stripe] Reconciling data discrepancy for user yyy: Firebase had plan=free, status=inactive, but Stripe shows active monthly subscription
[Stripe] ✓ Successfully reconciled Firebase data for user yyy
```

Estos logs te ayudarán a identificar si:
- La búsqueda por email funciona
- Se detectan y corrigen discrepancias
- Firebase se actualiza correctamente

---

## Resumen de Acciones

**Urgente (para ti ahora):**
1. ✅ Recargar `/settings` para forzar la reconciliación
2. ✅ Verificar en Firebase que los datos se actualizaron

**Para el futuro:**
1. ⚙️ Configurar webhook en Stripe Dashboard
2. 🔑 Añadir `STRIPE_WEBHOOK_SECRET` a `.env.local`
3. 🧪 Probar con Stripe CLI en desarrollo
4. ✅ Verificar que eventos futuros actualicen Firebase correctamente

---

## Solución de Problemas

### "No se actualiza Firebase después de recargar"

Verifica que:
- Tengas las credenciales de Firebase Admin configuradas (FIREBASE_SERVICE_ACCOUNT)
- El servidor esté corriendo con las variables de entorno actualizadas
- No haya errores en la consola del servidor

### "Webhook devuelve 401 o 400"

- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente
- En producción, asegúrate de que sea el signing secret del webhook de producción
- En desarrollo con Stripe CLI, usa el secret temporal que te da `stripe listen`

### "Los eventos no se registran en Stripe"

- Verifica que la URL del webhook sea accesible públicamente
- Stripe no puede enviar webhooks a `localhost` (usa Stripe CLI para desarrollo)
- Verifica que tu servidor esté corriendo en la URL configurada

---

## Documentación Adicional

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Test Stripe Webhooks](https://stripe.com/docs/webhooks/test)
- [Stripe Events Reference](https://stripe.com/docs/api/events/types)
