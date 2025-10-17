# VirtualDesk — Next.js + MongoDB (con Suspense y catálogo actualizado)

- Catálogo de servicios (pauta real) con **botón "Me interesa"** por servicio (sin +/−).
- Pedido se guarda al instante en `/api/orders` con `{ clientName, clientEmail, items:[...] }`.
- Endpoints con `try/catch` → errores 500 ahora devuelven JSON legible.
- Suspense en layout/header/footer; ChatWidget `dynamic(..., { ssr:false })`.

## .env.local
```env
MONGODB_URI=mongodb://127.0.0.1:27017/virtualdesk
MONGODB_DB=virtualdesk
```

## Comandos
```bash
npm install
npm run dev
```

## Debug de 500
- Asegúrate de que MongoDB esté activo y la URI sea correcta.
- Mira la consola del server: ahora verás `message` con el motivo (auth, URI, etc.).
- En Windows, usa `127.0.0.1` en vez de `localhost` si hay problemas.
